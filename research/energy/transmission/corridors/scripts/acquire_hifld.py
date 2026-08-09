"""Acquire the public HIFLD electric-transmission line layer at >=230 kV.

The ArcGIS layer contains geometry, status, ownership, and nominal voltage.  It
does not contain MW ratings.  This script intentionally does not manufacture a
capacity estimate from voltage.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "base-layers"
OUT.mkdir(parents=True, exist_ok=True)
SERVICE = "https://services5.arcgis.com/HDRa0B57OVrv2E1q/ArcGIS/rest/services/Electric_Power_Transmission_Lines/FeatureServer/0/query"
WHERE = "VOLTAGE >= 230 AND VOLTAGE <= 765"
FIELDS = "OBJECTID,ID,TYPE,STATUS,SOURCE,SOURCEDATE,VAL_METHOD,VAL_DATE,OWNER,VOLTAGE,VOLT_CLASS,INFERRED,SUB_1,SUB_2"


def fetch(params):
    url = SERVICE + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "US-Climate-Health-and-Water research acquisition"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    features = []
    offset = 0
    while True:
        payload = fetch({
            "where": WHERE,
            "outFields": FIELDS,
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "resultOffset": offset,
            "resultRecordCount": 2000,
            "orderByFields": "OBJECTID ASC",
        })
        batch = payload.get("features", [])
        features.extend(batch)
        if len(batch) < 2000:
            break
        offset += len(batch)
    output = {
        "type": "FeatureCollection",
        "name": "HIFLD_Electric_Power_Transmission_Lines_230kV_and_above",
        "source": SERVICE.rsplit("/query", 1)[0],
        "query": WHERE,
        "capacity_warning": "No MW rating is present; nominal voltage must not be converted to corridor capacity.",
        "features": features,
    }
    path = OUT / "hifld-transmission-lines-230kv-plus.geojson"
    path.write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")
    manifest = {
        "dataset_id": "DS-HIFLD-TRANSMISSION-LINES",
        "source_id": "SRC-HIFLD-TRANSMISSION-LINES",
        "acquired_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "service": SERVICE.rsplit("/query", 1)[0],
        "query": WHERE,
        "fields": FIELDS.split(","),
        "feature_count": len(features),
        "geometry_crs": "EPSG:4326",
        "rating_field_present": False,
        "limitations": [
            "The federal catalog says the dataset was last updated in 2022; individual feature source dates vary.",
            "The public layer omits MW ratings and contingency-specific transfer capability.",
            "EIA states that it and HIFLD do not publish substation locations.",
            "Use as context geometry, not as an authoritative real-time network model.",
        ],
    }
    (BASE / "base-layer-acquisition.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "features": len(features), "path": str(path)}, indent=2))


if __name__ == "__main__":
    main()
