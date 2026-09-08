(function () {
  'use strict';

  // A teaching cutaway of a generic high-bypass turbofan. Stage counts and the
  // single gold shaft are schematic; they do not reproduce a specific engine.
  window.EngineModel = {
    create: function (T) {
      var group = new T.Group();
      group.name = 'turbofan';
      var parts = {}, anchors = {}, pickables = [], finishes = [], rotors = [];
      var tau = Math.PI * 2;
      var colors = {
        inlet: 0xb6dbe9, fan: 0x68b8ca, bypass: 0x72cddd,
        compressor: 0x679db8, combustor: 0xec9a49,
        turbine: 0xb794af, shaft: 0xffd46a, nozzle: 0x91afbf
      };
      var anchorPositions = {
        inlet: [-3.4, 1.15, 1], fan: [-2.65, 0.75, 1.2],
        bypass: [-0.65, 1.12, 1.05], compressor: [-0.85, 0.45, 0.65],
        combustor: [0.6, 0.47, 0.65], turbine: [1.9, 0.43, 0.6],
        shaft: [-0.2, 0.08, 0.16], nozzle: [3.4, 0.4, 0.5]
      };
      Object.keys(colors).forEach(function (id) {
        var p = new T.Group(); p.name = id; p.userData.part = id;
        parts[id] = p; group.add(p);
        anchors[id] = new T.Vector3().fromArray(anchorPositions[id]);
      });

      function material(id, color, options) {
        var m = new T.MeshStandardMaterial(Object.assign({
          color: color == null ? colors[id] : color,
          metalness: 0.42, roughness: 0.4, side: T.DoubleSide
        }, options || {}));
        finishes.push({material: m, part: id, opacity: m.opacity,
          transparent: m.transparent, depthWrite: m.depthWrite,
          emissive: m.emissive.clone(), intensity: m.emissiveIntensity});
        return m;
      }
      function mesh(id, geo, color, parent, options) {
        var m = new T.Mesh(geo, material(id, color, options));
        m.userData.part = id; (parent || parts[id]).add(m);
        pickables.push(m); return m;
      }
      function axialCylinder(id, x, length, frontRadius, rearRadius, color, parent) {
        var geo = new T.CylinderGeometry(rearRadius, frontRadius, length, 48, 1, false);
        geo.rotateZ(-Math.PI / 2);
        var m = mesh(id, geo, color, parent); m.position.x = x; return m;
      }
      function ring(id, x, radius, thickness, color, parent) {
        var g = new T.TorusGeometry(radius, thickness, 10, 72);
        g.rotateY(Math.PI / 2);
        var m = mesh(id, g, color, parent); m.position.x = x; return m;
      }
      // Surface of revolution around X. Open angular ranges keep the cutaway
      // transparent to the camera, without an opaque disk across the core.
      function shellGeometry(profile, start, end) {
        var verts = [], uv = [], indices = [], steps = 64;
        for (var j = 0; j < profile.length; j++) {
          for (var i = 0; i <= steps; i++) {
            var a = start + (end - start) * i / steps;
            verts.push(profile[j][0], Math.cos(a) * profile[j][1], Math.sin(a) * profile[j][1]);
            uv.push(i / steps, j / (profile.length - 1));
          }
        }
        for (var row = 0; row < profile.length - 1; row++) {
          for (var k = 0; k < steps; k++) {
            var n = row * (steps + 1) + k;
            indices.push(n, n + steps + 1, n + 1, n + 1, n + steps + 1, n + steps + 2);
          }
        }
        var geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
        geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        geo.setIndex(indices); geo.computeVertexNormals(); return geo;
      }
      function shell(id, profile, start, end, color, parent, options) {
        return mesh(id, shellGeometry(profile, start, end), color, parent, options);
      }

      // Rounded inlet lip, with a silver band tracing the intake opening.
      shell('inlet', [[-3.75,1.48],[-3.68,1.67],[-3.45,1.79],[-3.1,1.81]], 0, tau, 0xc9e7eb);
      ring('inlet', -3.7, 1.54, 0.075, 0xe7f3f2);
      ring('inlet', -3.16, 1.77, 0.025, 0x719cb3);

      // The rear nacelle half stays behind the parts. Its foreground half lifts
      // upward and away from the viewing side as the child opens the engine.
      var nacelleProfile = [[-3.14,1.8],[-2.65,1.82],[-1.8,1.74],[0.2,1.64],[1.6,1.55],[2.75,1.29],[3.18,1.06]];
      shell('bypass', nacelleProfile, Math.PI, tau, 0xb0d6de);
      var hood = new T.Group(); hood.name = 'opening-nacelle'; parts.bypass.add(hood);
      shell('bypass', nacelleProfile, 0, Math.PI, 0xbedfe5, hood);
      [-2.45,-0.8,0.8,2.2].forEach(function (x, i) {
        var r = [1.79,1.69,1.61,1.4][i];
        shell('bypass', [[x-0.025,r+0.012],[x+0.025,r+0.012]], Math.PI, tau, 0x81b2c2);
        shell('bypass', [[x-0.025,r+0.012],[x+0.025,r+0.012]], 0, Math.PI, 0x91bac9, hood);
      });

      // Twisted, swept airfoil strips, with a thin rounded-looking cross section.
      // Shared geometry per rotor avoids hundreds of unique vertex buffers.
      function bladeGeometry(root, tip, chord, sweep, twist) {
        var pos = [], ix = [], segments = 8;
        for (var side = 0; side < 2; side++) {
          for (var s = 0; s <= segments; s++) {
            var t = s / segments;
            var width = chord * (0.6 + 0.65 * Math.sin(t * 2.2));
            var r = root + (tip - root) * t;
            for (var e = 0; e < 2; e++) {
              var edge = e ? 0.5 : -0.5;
              var angle = twist * (1 - t * 0.7);
              pos.push(edge * width * Math.cos(angle) + 0.15 * chord * t,
                r, sweep * t * t + edge * width * Math.sin(angle) + (side ? 0.012 : -0.012));
            }
          }
        }
        var count = (segments + 1) * 2;
        for (var layer = 0; layer < 2; layer++) {
          for (var j = 0; j < segments; j++) {
            var a = layer * count + j * 2;
            ix.push(a,a+1,a+2,a+1,a+3,a+2);
          }
        }
        for (var v = 0; v < segments; v++) {
          var p = v*2;
          ix.push(p,p+2,p+count,p+2,p+count+2,p+count);
          ix.push(p+1,p+count+1,p+3,p+3,p+count+1,p+count+3);
        }
        ix.push(0,count,1,1,count,count+1);
        ix.push(count-2,count-1,count*2-2,count-1,count*2-1,count*2-2);
        var geo = new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
        geo.setIndex(ix); geo.computeVertexNormals(); return geo;
      }
      function rotor(id, x, hub, radius, count, chord, speed, color) {
        var assembly = new T.Group(); assembly.position.x = x;
        assembly.name = id + '-rotor'; parts[id].add(assembly);
        axialCylinder(id, 0, chord * 0.8, hub, hub * 0.96, color, assembly);
        var blade = bladeGeometry(hub * 0.96, radius, chord, chord * 0.8, 1.05);
        var bladeMat = material(id, color);
        for (var i = 0; i < count; i++) {
          var b = new T.Mesh(blade, bladeMat); b.rotation.x = tau * i/count;
          b.userData.part = id; assembly.add(b); pickables.push(b);
        }
        rotors.push({node:assembly, speed:speed, phase:0}); return assembly;
      }
      var fan = rotor('fan', -2.84, 0.36, 1.57, 26, 0.37, 1.6, 0x80bdca);
      axialCylinder('fan', -3.22, 0.65, 0.035, 0.36, 0xe4eff0);
      ring('fan', -2.65, 0.39, 0.035, 0x3b849f);
      // Small spinner spiral makes even low-speed rotation visibly readable.
      var spiral = [];
      for (var q=0;q<42;q++) {
        var u=q/41, a=u*tau*1.1;
        spiral.push(new T.Vector3(-0.68+u*0.45, Math.cos(a)*(0.035+u*0.235), Math.sin(a)*(0.035+u*0.235)));
      }
      var spiralTube=new T.TubeGeometry(new T.CatmullRomCurve3(spiral),48,0.012,5,false);
      mesh('fan',spiralTube,0x478298,fan);

      // Core body is deliberately only a rear half so the stage rows remain
      // visible; annular air travels around a narrow central shaft.
      shell('compressor', [[-2.3,0.9],[-1.95,0.82],[-1.1,0.69],[-0.12,0.55]], Math.PI, tau, 0x466f89);
      [-2.05,-1.64,-1.22,-0.8,-0.38].forEach(function (x,i) {
        var r=0.83-i*0.064;
        rotor('compressor',x,0.23+i*0.022,r,26+i*2,0.16,1.6, i%2 ? 0x81b4c9 : 0x5b94b3);
        shell('compressor',[[x+0.18,r+0.02],[x+0.22,r+0.02]],Math.PI,tau,0xb9d8e3);
      });

      // Annular combustor around the shaft. Six injectors and glow pockets
      // indicate where fuel adds heat, rather than flames at the inlet/fan.
      shell('combustor', [[-0.03,0.57],[0.2,0.71],[0.94,0.71],[1.17,0.59]], Math.PI,tau,0xc97944);
      shell('combustor', [[0.08,0.34],[1.14,0.34]],0,tau,0xb98d5c);
      [0.13,0.49,0.84,1.08].forEach(function(x){
        shell('combustor',[[x-0.023,0.725],[x+0.023,0.725]],Math.PI,tau,0xf4bf78);
      });
      var glows = [];
      for (var f=0;f<8;f++) {
        var angle=tau*f/8, y=Math.cos(angle)*0.48,z=Math.sin(angle)*0.48;
        var injector=axialCylinder('combustor',0.12,0.23,0.043,0.035,0x805b4a);
        injector.position.y=y;injector.position.z=z;
        var fire=mesh('combustor',new T.SphereGeometry(1,12,8),0xffbd5a,null,
          {emissive:0xff6a18,emissiveIntensity:0.6,metalness:0.05,roughness:0.7});
        fire.position.set(0.56,y,z);fire.scale.set(0.24,0.065,0.065);glows.push(fire);
      }

      shell('turbine',[[1.22,0.62],[1.75,0.67],[2.43,0.8]],Math.PI,tau,0x785b79);
      [1.4,1.81,2.22].forEach(function(x,i){
        rotor('turbine',x,0.29-i*0.025,0.59+i*0.075,30,0.19,1.6, i%2?0xbd99b3:0x9b779d);
        shell('turbine',[[x+0.16,0.63+i*0.075],[x+0.21,0.63+i*0.075]],Math.PI,tau,0xd6b6c7);
      });
      var shaftRotor=new T.Group();shaftRotor.name='linked-shaft';parts.shaft.add(shaftRotor);
      axialCylinder('shaft',-0.13,5.52,0.104,0.104,0xf4ca62,shaftRotor);
      [-2.65,-1.25,1.43,2.18].forEach(function(x){ring('shaft',x,0.135,0.038,0xffdf8a,shaftRotor);});
      var stripe=mesh('shaft',new T.BoxGeometry(5.35,0.035,0.038),0xa97e21,shaftRotor);
      stripe.position.set(-0.14,0.106,0);
      rotors.push({node:shaftRotor,speed:1.6,phase:0});

      // A rear-half exhaust casing and center plug preserve the view down the
      // nozzle; the bypass stream exits around the core stream.
      shell('nozzle',[[2.48,0.84],[3.02,0.77],[3.7,0.66]],Math.PI,tau,0x91aebc);
      ring('nozzle',3.69,0.65,0.025,0xc7d9df);
      axialCylinder('nozzle',3.13,1.27,0.25,0.035,0x6a879a);
      shell('nozzle',[[3.06,1.13],[3.29,0.99]],Math.PI,tau,0xd3e6e7);

      var flowGroups={}, clouds=[], arrows=[];
      function radiusAt(kind,x) {
        if(kind==='bypass') return x<2.2 ? 1.43+0.06*Math.cos((x+2)*0.55) : 1.45-(x-2.2)*0.20;
        if(x<-2.1) return 0.72;
        if(x<0.05) return 0.72-(x+2.1)*0.12;
        if(x<1.15) return 0.49;
        return 0.49+(x-1.15)*0.012;
      }
      function flowPosition(kind,x,angle,out) {
        var r=radiusAt(kind,x); return out.set(x,Math.cos(angle)*r,Math.sin(angle)*r);
      }
      var blue=new T.Color(0x159be1), warm=new T.Color(0xff783d), cooling=new T.Color(0xf5af56);
      function airColor(kind,x,out) {
        if(kind==='bypass'||x<0.15)return out.copy(blue);
        if(x<0.7)return out.copy(blue).lerp(warm,(x-0.15)/0.55);
        return out.copy(warm).lerp(cooling,Math.max(0,(x-1)/3.4));
      }
      ['core','bypass'].forEach(function(kind){
        var fg=new T.Group();fg.name='flow-'+kind;group.add(fg);flowGroups[kind]=fg;
        var count=kind==='bypass'?112:84;
        var positions=new Float32Array(count*3), shades=new Float32Array(count*3);
        var geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));
        geo.setAttribute('color',new T.BufferAttribute(shades,3));
        var cloud=new T.Points(geo,new T.PointsMaterial({size:0.073,vertexColors:true,transparent:true,opacity:0.9,depthWrite:false}));
        cloud.userData.flow=kind;cloud.frustumCulled=false;fg.add(cloud);
        clouds.push({node:cloud,count:count,kind:kind,positions:positions,colors:shades});
        // Deliberately sparse near-side ribbons show separation even when
        // paused. Their pointed arrowheads make the flow direction explicit.
        [0.45,1.55,2.7].forEach(function(angle){
          for(var segment=0;segment<3;segment++) {
            var lo=[-4.15,0.15,0.7][segment],hi=[0.15,0.7,4.35][segment],curve=[];
            for(var s=0;s<=32;s++)curve.push(flowPosition(kind,lo+(hi-lo)*s/32,angle,new T.Vector3()));
            var shade=airColor(kind,(lo+hi)/2,new T.Color());
            var tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(curve),32,0.012,5,false),
              new T.MeshBasicMaterial({color:shade,transparent:true,opacity:0.28,depthWrite:false}));
            fg.add(tube);
          }
          for(var k=0;k<3;k++){
            var coneGeo=new T.ConeGeometry(0.072,0.21,9);coneGeo.rotateZ(-Math.PI/2);
            var cone=new T.Mesh(coneGeo,new T.MeshBasicMaterial({color:blue,transparent:true,opacity:0.95}));
            fg.add(cone);arrows.push({node:cone,kind:kind,angle:angle,phase:k/3});
          }
        });
      });
      var ptemp=new T.Vector3(),ctemp=new T.Color();
      function update(options) {
        options=options||{};
        var time=Number.isFinite(options.time)?options.time:0;
        var open=Number.isFinite(options.open)?Math.max(0,Math.min(1,options.open)):0.7;
        var flow=options.flow||'both', isolate=!!options.shaft,selected=options.selected;
        hood.position.set(0,open*2.55,-open*2.0);hood.rotation.x=-open*0.4;
        rotors.forEach(function(r){r.node.rotation.x=time*r.speed+r.phase;});
        glows.forEach(function(g,i){g.scale.x=0.24+0.035*Math.sin(time*7+i);});
        finishes.forEach(function(f){
          var m=f.material;
          m.opacity=isolate&&f.part!=='shaft'?0.12:f.opacity;
          m.transparent=isolate&&f.part!=='shaft'?true:f.transparent;
          m.depthWrite=isolate&&f.part!=='shaft'?false:f.depthWrite;
          m.emissive.copy(f.emissive);m.emissiveIntensity=f.intensity;
          if(selected===f.part){m.emissive.set(0x4b9ca2);m.emissiveIntensity=0.38;}
          if(isolate&&f.part==='shaft'){m.emissive.set(0xd59122);m.emissiveIntensity=0.35;}
        });
        clouds.forEach(function(c){
          var visible=!isolate&&(flow==='both'||flow===c.kind);
          flowGroups[c.kind].visible=visible;c.node.visible=visible;
          for(var i=0;i<c.count;i++){
            var phase=((i/c.count+time*(c.kind==='bypass'?0.17:0.13))%1+1)%1;
            var x=-4.15+phase*8.5,angle=0.13+(i%7)/7*tau;
            flowPosition(c.kind,x,angle,ptemp);
            c.positions[i*3]=ptemp.x;c.positions[i*3+1]=ptemp.y;c.positions[i*3+2]=ptemp.z;
            airColor(c.kind,x,ctemp);c.colors[i*3]=ctemp.r;c.colors[i*3+1]=ctemp.g;c.colors[i*3+2]=ctemp.b;
          }
          c.node.geometry.attributes.position.needsUpdate=true;
          c.node.geometry.attributes.color.needsUpdate=true;
        });
        arrows.forEach(function(a){
          var phase=((a.phase+time*0.14)%1+1)%1;
          var x=-4+phase*8.25;
          flowPosition(a.kind,x,a.angle,a.node.position);airColor(a.kind,x,a.node.material.color);
        });
      }
      update({time:0,open:0.7,flow:'both',shaft:false,selected:null});
      return {group:group,pickables:pickables,parts:parts,anchors:anchors,update:update};
    }
  };
})();
