# Mobility Database API — GTFS Feeds

**Base URL:** `https://api.mobilitydatabase.org`
**Swagger UI:** https://mobilitydata.github.io/mobility-feed-api/SwaggerUI/index.html
**OpenAPI Spec:** https://github.com/MobilityData/mobility-feed-api/blob/main/docs/DatabaseCatalogAPI.yaml

## Authentication

All endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens are obtained via OAuth2 (Firebase/Google Identity Platform). Tokens are valid for **1 hour**. A long-lived refresh token is used to obtain new access tokens.

## CORS

The API **reflects any `Origin` header** back in `Access-Control-Allow-Origin`, effectively allowing requests from any domain. It also sets `Access-Control-Allow-Credentials: true`. This means **no proxy is needed** for browser-based API calls.

Allowed methods: `GET`, `POST`
Allowed headers: `Authorization`, `Content-Type`
Preflight cache: 1200 seconds (20 minutes)

---

## `GET /v1/gtfs_feeds`

Get some (or all) GTFS feeds from the Mobility Database.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `limit` | integer | No | 2500 | Number of items to return (0–2500) |
| `offset` | integer | No | 0 | Offset of the first item to return |
| `provider` | string | No | — | Filter by transit provider name. Partial match, case insensitive. |
| `producer_url` | string (url) | No | — | Filter by producer URL. Partial match, case insensitive. |
| `country_code` | string | No | — | Filter by exact ISO 3166-1 alpha-2 country code (e.g. `US`) |
| `subdivision_name` | string | No | — | Filter by subdivision/state/province. Partial match, case insensitive. |
| `municipality` | string | No | — | Filter by municipality/city. Partial match, case insensitive. |
| `dataset_latitudes` | string | No | — | Min and max latitudes for bounding box filter (e.g. `33.5,34.5`). Must be used with `dataset_longitudes`. |
| `dataset_longitudes` | string | No | — | Min and max longitudes for bounding box filter (e.g. `-118.0,-119.0`). Must be used with `dataset_latitudes`. |
| `bounding_filter_method` | string | No | `completely_enclosed` | How to apply the bounding box: `completely_enclosed`, `partially_enclosed`, or `disjoint` |
| `is_official` | boolean | No | null | If true, only return official feeds |

### Example Request

```bash
curl -X GET \
  'https://api.mobilitydatabase.org/v1/gtfs_feeds?limit=10&offset=0&country_code=US&subdivision_name=California&municipality=Los%20Angeles' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

### Response

**200 OK** — Returns an array of `GtfsFeed` objects.

```json
[
  {
    "id": "mdb-1210",
    "data_type": "gtfs",
    "created_at": "2024-02-08T00:00:00Z",
    "external_ids": [
      { "external_id": "1210", "source": "mdb" },
      { "external_id": "ladot-transit-services/303", "source": "transitfeeds" }
    ],
    "provider": "Los Angeles Department of Transportation (LADOT, DASH, Commuter Express)",
    "feed_contact_email": "",
    "source_info": {
      "producer_url": "https://ladotbus.com/gtfs",
      "authentication_type": 0,
      "authentication_info_url": "",
      "api_key_parameter_name": "",
      "license_url": "https://www.ladottransit.com/dla.html",
      "license_id": null,
      "license_is_spdx": null,
      "license_notes": null
    },
    "redirects": [],
    "status": "active",
    "official": true,
    "official_updated_at": "2025-04-30T21:14:43.062475",
    "feed_name": "Bus",
    "note": "",
    "related_links": [],
    "locations": [
      {
        "country_code": "US",
        "country": "United States",
        "subdivision_name": "California",
        "municipality": "Los Angeles"
      }
    ],
    "latest_dataset": {
      "id": "mdb-1210-202603080117",
      "hosted_url": "https://files.mobilitydatabase.org/mdb-1210/mdb-1210-202603080117/mdb-1210-202603080117.zip",
      "bounding_box": null,
      "downloaded_at": "2026-03-08T01:17:14.049050Z",
      "hash": "026a1f75a32c4ba4ec3866f70a5f9eecc12144d47d147bcf2b393cb0590c9988",
      "service_date_range_start": null,
      "service_date_range_end": null,
      "agency_timezone": null,
      "zipped_folder_size_mb": 3.53,
      "unzipped_folder_size_mb": 17.24,
      "validation_report": null
    },
    "bounding_box": {
      "minimum_latitude": 33.721601,
      "maximum_latitude": 34.323077,
      "minimum_longitude": -118.882829,
      "maximum_longitude": -118.131748
    },
    "visualization_dataset_id": "mdb-1210-202602110059"
  }
]
```

---

## Response Schema: `GtfsFeed`

Inherits from `BasicFeed` → `Feed`, adding GTFS-specific fields.

### Core Fields (from BasicFeed)

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique feed identifier (e.g. `mdb-1210`) |
| `data_type` | string | Always `"gtfs"` for this endpoint |
| `created_at` | string (date-time) | When the feed was added to the database |
| `external_ids` | ExternalId[] | IDs in external databases (MDB, TransitFeeds, Transit.land, etc.) |
| `provider` | string | Transit provider name |
| `feed_contact_email` | string | Contact email for the feed producer |
| `source_info` | SourceInfo | Producer URL, authentication, and license details |
| `redirects` | Redirect[] | Feed redirects (if the feed has been superseded) |

### Feed Fields

| Field | Type | Description |
|---|---|---|
| `status` | string | `active`, `deprecated`, `inactive`, `development`, or `future` |
| `official` | boolean | Whether the feed is from the transit agency or a trusted source |
| `official_updated_at` | string (date-time) | When the official status was last updated |
| `feed_name` | string | Optional description (e.g. "Bus", "Rail") |
| `note` | string | Note for complex use cases |
| `related_links` | FeedRelatedLink[] | Related URLs (e.g. future feed versions) |

### GTFS-Specific Fields

| Field | Type | Description |
|---|---|---|
| `locations` | Location[] | Geographic locations the feed covers |
| `latest_dataset` | LatestDataset | Info about the most recent dataset |
| `bounding_box` | BoundingBox | Geographic bounding box of the feed |
| `visualization_dataset_id` | string | Dataset ID used for visualization |

### Nested Objects

#### SourceInfo

| Field | Type | Description |
|---|---|---|
| `producer_url` | string (url) | Where the GTFS data is published |
| `authentication_type` | integer | `0` = none, `1` = API key in URL, `2` = API key in HTTP header |
| `authentication_info_url` | string (url) | How to get credentials (for types 1 and 2) |
| `api_key_parameter_name` | string | Name of the API key parameter |
| `license_url` | string (url) | URL of the feed license |
| `license_id` | string | SPDX license ID (e.g. `CC-BY-4.0`) |
| `license_is_spdx` | boolean | Whether the license is SPDX |
| `license_notes` | string | Additional license notes |

#### Location

| Field | Type | Description |
|---|---|---|
| `country_code` | string | ISO 3166-1 alpha-2 code (e.g. `US`) |
| `country` | string | Country name in English |
| `subdivision_name` | string | State/province/region name |
| `municipality` | string | City name |

#### LatestDataset

| Field | Type | Description |
|---|---|---|
| `id` | string | Dataset identifier |
| `hosted_url` | string (url) | Direct download URL hosted by MobilityData (no auth required) |
| `bounding_box` | BoundingBox | Geographic bounds of this dataset |
| `downloaded_at` | string (date-time) | When this dataset was fetched from the producer |
| `hash` | string | SHA-256 hash of the dataset |
| `service_date_range_start` | string (date-time) | Start of service coverage |
| `service_date_range_end` | string (date-time) | End of service coverage |
| `agency_timezone` | string | IANA timezone (e.g. `America/Los_Angeles`) |
| `zipped_folder_size_mb` | number | Size of the zip file in MB |
| `unzipped_folder_size_mb` | number | Uncompressed size in MB |
| `validation_report` | ValidationReport | GTFS validation summary |

#### BoundingBox

| Field | Type | Description |
|---|---|---|
| `minimum_latitude` | number | Southern bound |
| `maximum_latitude` | number | Northern bound |
| `minimum_longitude` | number | Western bound |
| `maximum_longitude` | number | Eastern bound |

---

## Related Endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/gtfs_feeds/{id}` | Get a single GTFS feed by ID |
| `GET /v1/gtfs_feeds/{id}/datasets` | Get datasets for a GTFS feed |
| `GET /v1/gtfs_feeds/{id}/gtfs_rt_feeds` | Get related GTFS-RT feeds |
| `GET /v1/datasets/gtfs/{id}` | Get a single GTFS dataset by ID |
| `GET /v1/search` | Full-text search across all feed types |
