"""Record current HTTP accessibility for every transmission source URL.

This complements, but does not replace, the human claim-fidelity review in
source-verification.json. Some official sites block scripted requests; those
results remain explicit rather than being treated as proof a source is absent.
"""

from __future__ import annotations

import concurrent.futures
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
SOURCE_PATH = BASE / "source-verification.json"
OUTPUT_PATH = BASE / "source-link-check.json"


def check(item):
    source_id, field, url = item
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 US-Climate-Health-and-Water source verification",
            "Range": "bytes=0-4095",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            response.read(4096)
            return {
                "source_id": source_id,
                "url_field": field,
                "requested_url": url,
                "status": response.status,
                "accessible": 200 <= response.status < 400,
                "final_url": response.geturl(),
                "content_type": response.headers.get("Content-Type", ""),
            }
    except urllib.error.HTTPError as error:
        return {
            "source_id": source_id,
            "url_field": field,
            "requested_url": url,
            "status": error.code,
            "accessible": False,
            "final_url": error.geturl(),
            "content_type": error.headers.get("Content-Type", "") if error.headers else "",
            "error": str(error),
        }
    except Exception as error:  # noqa: BLE001 - evidence capture must retain all failure types
        return {
            "source_id": source_id,
            "url_field": field,
            "requested_url": url,
            "status": None,
            "accessible": False,
            "error": f"{type(error).__name__}: {error}",
        }


def main():
    sources = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))["sources"]
    items = []
    for source in sources:
        for field in ("url", "artifact_url", "service_url"):
            if source.get(field):
                items.append((source["source_id"], field, source[field]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        records = list(executor.map(check, items))
    records.sort(key=lambda record: (record["source_id"], record["url_field"]))
    output = {
        "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "purpose": "HTTP accessibility check; claim fidelity remains documented in source-verification.json",
        "endpoints_checked": len(records),
        "accessible_endpoints": sum(record["accessible"] for record in records),
        "inaccessible_or_script_blocked_endpoints": sum(not record["accessible"] for record in records),
        "records": records,
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: output[key] for key in ("checked_at", "endpoints_checked", "accessible_endpoints", "inaccessible_or_script_blocked_endpoints")}, indent=2))


if __name__ == "__main__":
    main()
