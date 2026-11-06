import pytest
from backend.ingestion.connectors import DeclarativeConnector, get_nested

def test_get_nested_helper():
    data = {"company": {"name": "Tech Corp"}, "location": "Bengaluru", "id": 123}
    assert get_nested(data, "company.name") == "Tech Corp"
    assert get_nested(data, "location") == "Bengaluru"
    assert get_nested(data, "id") == 123
    assert get_nested(data, "missing.key", default="N/A") == "N/A"

def test_declarative_connector_mapping():
    class TestConnector(DeclarativeConnector):
        name = "TestATS"
        title_path = "role_name"
        company_path = "org"
        location_path = "geo"
        apply_url_path = "apply_link"
        desc_path = "text"

    connector = TestConnector()
    payload = {
        "id": "1001",
        "role_name": "Full Stack Engineer",
        "org": "Acme Inc",
        "geo": "Bengaluru, Karnataka",
        "apply_link": "https://careers.acme.com/jobs/1001",
        "text": "Join Acme to build scalable Python and React systems."
    }

    job = connector.map_item(payload, prefix="TEST")
    assert job is not None
    assert job.title == "Full Stack Engineer"
    assert job.company == "Acme Inc"
    assert job.location == "Bengaluru, Karnataka"
    assert job.apply_url == "https://careers.acme.com/jobs/1001"
    assert "Python" in job.skills
    assert "React" in job.skills

def test_declarative_connector_skips_invalid_urls():
    class TestConnector(DeclarativeConnector):
        name = "TestATS"
        apply_url_path = "url"

    connector = TestConnector()
    # Missing URL
    assert connector.map_item({"title": "Dev", "url": ""}) is None
    # Hash URL
    assert connector.map_item({"title": "Dev", "url": "#"}) is None
    # Non-http URL
    assert connector.map_item({"title": "Dev", "url": "ftp://files.example.com"}) is None

