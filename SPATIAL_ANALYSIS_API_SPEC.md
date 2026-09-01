# Spatial Analysis — Backend API Specification

> For the backend developer implementing the dynamic spatial analysis endpoints.
> Frontend code: `src/features/spatialanalysis/`, `src/api/spatialAnalysisApi.js`

---

## 1. Main Endpoint: Execute Spatial Query

### `POST /api/spatial-analysis/query/`

This is the **primary endpoint** the frontend needs. When deployed, the frontend auto-detects it and switches from client-side engine to backend execution.

#### Request Payload

```json
{
  "target_layer": {
    "layer_id": "Rural_population",
    "name": "Rural_population",
    "geometry_type": "Polygon"
  },
  "spatial": {
    "condition": "within_radius",
    "distance_km": 5,
    "reference": {
      "type": "facility-category",
      "layer_id": "health",
      "name": "Health facilities"
    }
  },
  "attribute_filters": [
    {
      "field": "population",
      "operator": "gte",
      "value": "1000",
      "logic": "and"
    },
    {
      "field": "accessibility",
      "operator": "eq",
      "value": "Poor",
      "logic": "and"
    }
  ],
  "output_fields": [
    "name",
    "population",
    "nearestFacility",
    "distanceKm",
    "accessibility",
    "gapScore",
    "priorityScore"
  ],
  "sort": {
    "field": "priorityScore",
    "direction": "desc"
  },
  "limit": 50
}
```

#### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_layer.layer_id` | string | Yes | ID of the GIS layer to query (from `GET /api/gis/catalog/`) |
| `target_layer.name` | string | Yes | Display name of the layer |
| `target_layer.geometry_type` | string | Yes | `Polygon`, `Point`, or `LineString` |
| `spatial.condition` | string | Yes | Spatial operator (see conditions below) |
| `spatial.distance_km` | number | Conditional | Distance in km. Required for `within_radius`, `buffer`, `distance` |
| `spatial.reference.type` | string | Yes | `point`, `gis-layer`, or `facility-category` |
| `spatial.reference.layer_id` | string | Conditional | Layer/category ID. Required when type is `gis-layer` or `facility-category` |
| `spatial.reference.name` | string | No | Display name |
| `spatial.reference.point` | [lng, lat] | Conditional | `[longitude, latitude]`. Required when type is `point` |
| `attribute_filters` | array | No | Array of filter objects (see below) |
| `output_fields` | string[] | No | Fields to return. Default: `["name"]` |
| `sort.field` | string | No | Field to sort by. Default: `"name"` |
| `sort.direction` | string | No | `"asc"` or `"desc"`. Default: `"asc"` |
| `limit` | number | No | Max results (1–500). Default: `50` |

#### Spatial Conditions

| Condition | Description | Requires `distance_km` | Requires `reference` |
|-----------|-------------|----------------------|---------------------|
| `within_radius` | Target features within straight-line radius of reference | Yes | Yes |
| `buffer` | Features inside a buffer polygon around reference point | Yes | Yes |
| `nearest` | Closest features to reference, ranked by distance | No | Yes |
| `polygon_containment` | Target features inside the reference polygon layer | No | Yes (gis-layer) |
| `intersects` | Target geometries that intersect reference geometry | No | Yes |
| `distance` | Distance to reference returned as a field | Yes | Yes |
| `road_route` | OSRM road distance to reference point | No | Yes (point) |

#### Attribute Filter Object

```json
{
  "field": "population",
  "operator": "gte",
  "value": "1000",
  "logic": "and"
}
```

| Operator | Description | Example Value |
|----------|-------------|---------------|
| `eq` | Equals (case-insensitive strings) | `"Poor"` |
| `ne` | Not equals | `"Good"` |
| `gt` | Greater than (numeric) | `"500"` |
| `gte` | Greater than or equal | `"1000"` |
| `lt` | Less than | `"100"` |
| `lte` | Less than or equal | `"50"` |
| `contains` | String contains | `"hospital"` |
| `in` | Value in comma-separated list | `"Poor,Moderate"` |

`logic`: `"and"` (default) or `"or"` — how this filter joins to the previous filter.

#### Reference Types

| `type` | Meaning | Additional Fields |
|--------|---------|-------------------|
| `point` | A specific `[lng, lat]` coordinate | `point: [85.4434, 25.1372]` |
| `gis-layer` | All features from a GIS layer (e.g. all health facilities from a layer) | `layer_id: "health_layer_name"` |
| `facility-category` | All facilities from a category (built from `GET /api/facilities/`) | `layer_id: "health"` (category name) |

---

## 2. Response Contract

```json
{
  "total_count": 12,
  "results": [
    {
      "id": "block_1",
      "rank": 1,
      "name": "Nalanda Block 1",
      "population": 15230,
      "nearestFacility": "PHC Nalanda",
      "distanceKm": 3.2,
      "roadDistanceKm": 4.1,
      "accessibility": "Moderate",
      "accessibilityBasis": "4.1 km from nearest road (National_Highway)",
      "gapScore": 0.72,
      "priorityScore": 0.85,
      "position": [85.4434, 25.1372],
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[85.44, 25.13], [85.45, 25.13], [85.45, 25.14], [85.44, 25.14], [85.44, 25.13]]]
      },
      "properties": {
        "Block_Rura": 15230,
        "Block_Tota": 18900,
        "Sub_distri": "Nalanda"
      }
    }
  ],
  "summary": {
    "targetLayer": "Rural_population",
    "condition": "within_radius (5 km)",
    "referenceLayer": "Health facilities",
    "limit": 50
  },
  "diagnosis": {
    "blocksExamined": 20,
    "withinRadius": 15,
    "populationPassed": 12,
    "roadRange": { "min": 0.03, "max": 1.38, "median": 0.44 },
    "byAccessibility": { "Good": 8, "Moderate": 7, "Poor": 0 }
  },
  "provenance": {
    "generatedAt": "2026-09-01T12:00:00Z",
    "computedFields": [
      "nearestFacility: nearest reference feature by Haversine distance",
      "distanceKm: Haversine distance to nearest reference feature",
      "accessibility: derived from nearest road distance (<=1km Good, <=3km Moderate, else Poor)",
      "gapScore: 0.5 * coverage + 0.5 * isolation of nearest facility",
      "priorityScore: 0.4 * popTier + 0.3 * gapScore + 0.2 * accessPenalty + 0.1 * distPenalty"
    ],
    "endpoint": "POST /api/spatial-analysis/query/",
    "backendQueryEndpoint": "POST /api/spatial-analysis/query/"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_count` | number | Total matching features (before limit) |
| `results` | array | Ranked result rows |
| `results[].id` | string | Unique feature ID |
| `results[].rank` | number | Rank in result set (1 = highest priority) |
| `results[].name` | string | Feature name |
| `results[].position` | [lng, lat] | Centroid coordinates (for map markers) |
| `results[].geometry` | GeoJSON | Full geometry (for polygon display) |
| `results[].properties` | object | Raw source attributes from the layer |
| `results[].nearestFacility` | string | Name of nearest reference feature |
| `results[].distanceKm` | number | Straight-line distance to nearest reference (km) |
| `results[].roadDistanceKm` | number | Road distance to nearest reference (km, if computed) |
| `results[].accessibility` | string | `"Good"`, `"Moderate"`, or `"Poor"` |
| `results[].accessibilityBasis` | string | Human-readable explanation of accessibility derivation |
| `results[].gapScore` | number | 0.0–1.0 facility gap score |
| `results[].priorityScore` | number | 0.0–1.0 combined priority score |
| `summary` | object | Human-readable summary of what was queried |
| `diagnosis` | object | Debugging info (why results are empty, distribution, etc.) |
| `provenance` | object | Audit trail — how results were computed |

---

## 3. Required Supporting Endpoints (Already Exist)

These endpoints are **already deployed** and used by the frontend. The backend developer should verify they return the correct format.

### `GET /api/gis/catalog/`

Returns available GIS layers. Frontend uses this to populate the layer picker.

```json
{
  "categories": {
    "Population": [
      {
        "name": "Rural_population",
        "displayName": "Rural Population",
        "geometryType": "Polygon",
        "featureCount": 20
      }
    ],
    "Roads": [...]
  }
}
```

### `GET /api/gis/layers/{layer_name}/`

Returns GeoJSON features for a specific layer.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "block_1",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "properties": {
        "Block_Name": "Nalanda",
        "Block_Rura": 15230,
        "Block_Tota": 18900
      }
    }
  ]
}
```

### `GET /api/facilities/`

Returns all facilities (~8.3k rows). Each facility needs:

```json
{
  "id": 123,
  "name": "PHC Nalanda",
  "categoryLabel": "Health",
  "latitude": 25.1372,
  "longitude": 85.4434,
  "attributes": {
    "population_served": 15000,
    "type": "PHC"
  }
}
```

**Critical fields for spatial analysis:**
- `id` — unique identifier
- `name` — facility name
- `categoryLabel` — used to group into categories (Health, Education, etc.)
- `latitude` / `longitude` — coordinates (converted to `[lng, lat]` position by frontend)
- `attributes` — any additional attributes (used for filtering)

---

## 4. Optional Endpoint: Save/Load Queries

### `GET /api/saved-queries/`

Returns saved queries. Frontend probes this to determine if save is available.

```json
[
  {
    "id": 1,
    "name": "Health gap in Nalanda",
    "visibility": "district",
    "query": { ... },
    "created_at": "2026-09-01T12:00:00Z"
  }
]
```

### `POST /api/saved-queries/`

Save a new query.

**Request:**
```json
{
  "name": "Health gap in Nalanda",
  "visibility": "district",
  "query": {
    "target_layer": { ... },
    "spatial": { ... },
    "attribute_filters": [ ... ],
    "output_fields": [ ... ],
    "sort": { ... },
    "limit": 50
  }
}
```

---

## 5. Computed Fields (Backend Should Derive)

The frontend currently computes these client-side. The backend should ideally compute them for accuracy:

| Field | Formula | Description |
|-------|---------|-------------|
| `nearestFacility` | Haversine nearest | Name of closest reference feature |
| `distanceKm` | Haversine | Straight-line distance to nearest reference (km) |
| `roadDistanceKm` | OSRM / PostGIS | Road distance to nearest reference (km) |
| `accessibility` | Road distance thresholds | `<=1km` Good, `<=3km` Moderate, else Poor |
| `gapScore` | `0.5 * coverage + 0.5 * isolation` | Facility coverage-deficit score |
| `priorityScore` | `0.4 * popTier + 0.3 * gap + 0.2 * access + 0.1 * dist` | Combined priority |

### Priority Score Breakdown

```
popTier = min(population / 20000, 1.0)
gap = gapScore (0.0–1.0)
accessPenalty = 1.0 if accessibility == "Poor", 0.5 if "Moderate", 0.0 if "Good"
distPenalty = min(distanceKm / 20, 1.0)

priorityScore = 0.4 * popTier + 0.3 * gap + 0.2 * accessPenalty + 0.1 * distPenalty
```

### Accessibility Thresholds

```
distanceToNearestRoad <= 1 km  → "Good"
distanceToNearestRoad <= 3 km  → "Moderate"
distanceToNearestRoad >  3 km  → "Poor"
```

Road layers used: `Other_Roads`, `National_Highway`, `State_Highway`

---

## 6. Frontend Capability Detection

The frontend auto-detects backend capability:

```
POST /api/spatial-analysis/query/ with probe payload
  → 200/201: backend available, use backend execution
  → 400/422: endpoint exists but probe rejected (still available)
  → 404/405: endpoint not deployed → fallback to client engine
  → 5xx:     backend bug → fallback to client engine + show error
```

The client engine executes the **exact same query contract** over `GET /api/facilities/` + `GET /api/gis/layers/{name}/`, so the backend endpoint is a drop-in optimization — no frontend changes needed.

---

## 7. Error Responses

```json
{
  "error": "invalid_query",
  "message": "The spatial condition 'within_radius' requires a reference layer.",
  "details": {
    "field": "spatial.reference",
    "reason": "missing_required"
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid query payload |
| 404 | Layer or reference not found |
| 422 | Unprocessable (valid JSON, invalid semantics) |
| 500 | Backend error (should not happen) |

---

## 8. Database Schema Hint (PostGIS)

```sql
-- GIS layers stored as GeoJSON or PostGIS geometry
CREATE TABLE gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    category VARCHAR(100),
    geometry_type VARCHAR(50),  -- Point, Polygon, LineString
    feature_count INTEGER DEFAULT 0,
    geojson JSONB,              -- or use PostGIS geometry column
    created_at TIMESTAMP DEFAULT NOW()
);

-- Facilities
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    category_label VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    geom GEOMETRY(Point, 4326),
    attributes JSONB,
    district_id INTEGER,
    department_id INTEGER
);

-- Spatial query execution (PostGIS example)
SELECT
    f.id,
    f.name,
    f.geom,
    ST_Distance(f.geom, ref.geom) / 1000.0 AS distance_km
FROM facilities f
CROSS JOIN (SELECT geom FROM facilities WHERE category_label = 'Health' LIMIT 1) ref
WHERE ST_DWithin(f.geom, ref.geom, 5000)  -- 5km in meters
ORDER BY distance_km
LIMIT 50;
```

---

## Summary for Backend Developer

1. **Implement `POST /api/spatial-analysis/query/`** — accept the payload above, execute PostGIS spatial query, return the response contract
2. **Ensure `GET /api/gis/catalog/`** returns layer metadata in the format above
3. **Ensure `GET /api/gis/layers/{name}/`** returns GeoJSON features
4. **Ensure `GET /api/facilities/`** returns facilities with `id`, `name`, `categoryLabel`, `latitude`, `longitude`, `attributes`
5. **Optionally implement `GET/POST /api/saved-queries/`** for query persistence

The frontend will **automatically detect** the backend endpoint and use it. No frontend changes needed.

