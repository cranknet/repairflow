# Load Testing

This directory contains k6 load testing scripts for RepairFlow.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt install k6
```

## Available Tests

### Concurrent Users Test
Tests the application under increasing load with multiple concurrent users.

```bash
# Run with defaults (ramp up to 50 concurrent users)
k6 run load-tests/concurrent-users.js

# Custom VUs and duration
k6 run --vus 100 --duration 10m load-tests/concurrent-users.js

# Against production
BASE_URL=https://your-domain.com k6 run load-tests/concurrent-users.js

# Export results to JSON
k6 run --out json=results.json load-tests/concurrent-users.js

# Export to InfluxDB (for Grafana dashboards)
k6 run --out influxdb=http://localhost:8086/k6 load-tests/concurrent-users.js
```

## Scenarios

The concurrent users test includes 3 scenarios:

1. **Health Checks** - Constant 5 VUs hitting health endpoints
2. **Concurrent Users** - Ramping pattern: 0 → 10 → 25 → 50 → 25 → 0 over 9 minutes
3. **Spike Test** - Sudden spike to 100 VUs (starts after main test)

## Thresholds

- HTTP request duration p95 < 500ms
- HTTP request duration p99 < 1000ms
- Error rate < 5%
- Health check p95 < 100ms
- Ticket creation p95 < 2000ms

## Interpreting Results

Key metrics to watch:
- **http_req_duration**: Response time (lower is better)
- **http_reqs**: Request rate (higher means better throughput)
- **errors**: Error rate (should be < 5%)
- **vus**: Active virtual users at each point

## Tips

- Run against staging, not production
- Coordinate with team before load testing
- Monitor server resources during tests
- Run multiple iterations for consistent results
