import json,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from story_resources import discover

class EntryReaderTests(unittest.TestCase):
    def test_actual_entry_version_and_missing_audio(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td)/'books/demo';(base/'images').mkdir(parents=True)
            (base/'images/cover.webp').write_bytes(b'fixture')
            (base/'story.json').write_text(json.dumps(dict(bookId='demo',scenes=[dict(id='a',image='cover',zh='甲',en='A')],vocab=[])))
            entries=[dict(id='scene-a-'+lang,text=text,output='audio/scene-a-'+lang+'.mp3') for lang,text in [('zh','甲'),('en','A')]]
            (base/'audio-manifest.json').write_text(json.dumps(dict(bookId='demo',entries=entries)))
            (base/'index.html').write_text('<script src="model.js"></script><script defer src="book-ui.js?v=2"></script><script src="../../shared/pwa.js"></script>')
            (base/'model.js').write_text('const model = {};')
            (base/'book-ui.js').write_text('const AUDIO_VER=9;')
            r=discover(td,'demo');self.assertEqual(r['audioExpected'],2);self.assertEqual(len(r['missingAudio']),2)
            self.assertTrue(all(p.endswith('?v=9') for p in r['missingAudio']))
            self.assertEqual(r['audioVersion'],'9')
            (base/'sfx').mkdir()
            (base/'sfx/drum.wav').write_bytes(b'fixture')
            (base/'model.js').write_text("const sfx='sfx/drum.wav';")
            self.assertEqual(discover(td,'demo')['sfx'], ['books/demo/sfx/drum.wav'])
            self.assertEqual(discover(td,'demo')['audioExpected'],2)
            (base/'model.js').write_text("const sfx='sfx/missing.wav';")
            with self.assertRaisesRegex(ValueError,'Missing/invalid interaction sound'):
                discover(td,'demo')
            (base/'model.js').write_text('const model={};')
            (base/'images/interaction.webp').write_bytes(b'fixture')
            (base/'model.js').write_text("const image='images/interaction.webp';")
            (base/'unused.js').write_text("const image='images/not-used.webp';")
            self.assertEqual(discover(td,'demo')['images'],
                             ['books/demo/images/cover.webp','books/demo/images/interaction.webp'])
            (base/'model.js').write_text("const image='images/missing.webp';")
            with self.assertRaisesRegex(ValueError,'Missing/invalid story image'):
                discover(td,'demo')
            (base/'model.js').write_text('const model={};')
            (base/'book-ui.js').write_text('const OTHER=9;')
            with self.assertRaisesRegex(ValueError,'AUDIO_VER'):discover(td,'demo')
            (base/'model.js').write_text('const model={};')
            (base/'images/revised.webp').write_bytes(b'fixture')
            (base/'book-ui.js').write_text('const AUDIO_VER=9; const SCENE_IMAGES={"a":"revised"};')
            self.assertEqual(discover(td,'demo')['images'],['books/demo/images/revised.webp'])
            self.assertEqual(discover(td,'demo')['cover'],'images/revised.webp')
            (base/'book-ui.js').write_text('const AUDIO_VER=9; const SCENE_IMAGES={"unknown":"revised"};')
            with self.assertRaisesRegex(ValueError,'Unknown scene'):discover(td,'demo')
            (base/'book-ui.js').write_text('const AUDIO_VER=9;')
            (base/'model.js').write_text('const AUDIO_VER=8;')
            with self.assertRaisesRegex(ValueError,'AUDIO_VER'):discover(td,'demo')

if __name__=='__main__':unittest.main()
