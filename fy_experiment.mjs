// Fisher-Yates O(n) empirical verification
// Run with: node fy_experiment.mjs

function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const sizes = [100, 1000, 10000, 50000, 100000];
const repetitions = 5;

// Warm-up: let V8 JIT compile and stabilize
console.log("Warming up V8 JIT...");
for (let w = 0; w < 3; w++) {
  const arr = Array.from({ length: 50000 }, (_, i) => i);
  fisherYates(arr);
}

console.log("\n=== Fisher-Yates Empirical Timing ===");
console.log("n\trun1\trun2\trun3\trun4\trun5\tmean(ms)\tratio(ms/n)");

const results = [];
for (const n of sizes) {
  const runs = [];
  for (let r = 0; r < repetitions; r++) {
    const arr = Array.from({ length: n }, (_, i) => i);
    const t0 = performance.now();
    fisherYates(arr);
    const t1 = performance.now();
    runs.push(t1 - t0);
  }
  const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
  const ratio = mean / n;
  results.push({ n, runs, mean, ratio });
  console.log(`${n}\t${runs.map(r => r.toFixed(3)).join("\t")}\t${mean.toFixed(4)}\t${ratio.toExponential(3)}`);
}

console.log("\n=== Summary ===");
console.log("If T(n) = c·n holds, the ratio column should stay roughly constant.");
console.log("Small deviation at n=100 (JIT warm-up residue) is normal.");
console.log("Slight increase at n=100000 (L1/L2 cache pressure) is normal.");