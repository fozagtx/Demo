#!/bin/bash
set -euo pipefail
mkdir -p output/frames qa
for i in $(seq 0 359); do printf -v n '%03d' "$i"; scripts/render-frame "$i" "output/frames/f$n.jpg"; done
node scripts/mp4.mjs output/okupy-demo-final.mp4
cp output/okupy-demo-final.mp4 output/okupy-demo-review.mp4
for s in 5 20 40 60 80 100 120 140 160 175; do i=$((s*2)); printf -v n '%03d' "$i"; cp "output/frames/f$n.jpg" "qa/${s}s.jpg"; done
