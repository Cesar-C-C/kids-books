"""Small planning helpers shared by cloud voice generation and tests."""


def select_jobs(jobs, language):
    if language == "all":
        return list(jobs)
    return [job for job in jobs if job["lang"] == language]


def resolve_reference(source, language):
    references = source.get("references", {})
    return references.get(language, source.get("reference"))
