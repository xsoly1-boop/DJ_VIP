import fetch from 'node-fetch';

const ipToFind = '2600:1f14:b9e:7b03:c7e0:f3a0:1bd7:a1d';

// Convert IPv6 string to BigInt for range check
function ip6ToBigInt(ip) {
  const parts = ip.split(':');
  let result = 0n;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') {
      // Handle :: shorthand
      const fillCount = 8 - parts.length + 1;
      result = (result << BigInt(fillCount * 16));
    } else {
      result = (result << 16n) + BigInt(parseInt(part, 16));
    }
  }
  return result;
}

// Simple check if target IP is in CIDR range
function ipInCidr(ip, cidr) {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    
    // Normalize range and IP
    const rangeBig = ip6ToBigInt(expandIPv6(range));
    const ipBig = ip6ToBigInt(expandIPv6(ip));
    
    const mask = (1n << 128n) - (1n << BigInt(128 - bits));
    return (rangeBig & mask) === (ipBig & mask);
  } catch (e) {
    return false;
  }
}

// Helper to expand compressed IPv6
function expandIPv6(ip) {
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0].split(':').filter(Boolean);
    const right = parts[1].split(':').filter(Boolean);
    const missing = 8 - (left.length + right.length);
    const middle = Array(missing).fill('0');
    return [...left, ...middle, ...right].join(':');
  }
  return ip;
}

async function findAwsRegion() {
  console.log("📥 Descargando rangos de IP de AWS...");
  try {
    const res = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await res.json();
    console.log(`Buscando región para la IP: ${ipToFind}...`);
    
    const ipv6Prefixes = data.ipv6_prefixes || [];
    for (const prefix of ipv6Prefixes) {
      if (ipInCidr(ipToFind, prefix.ipv6_prefix)) {
        console.log(`\n🎉 Encontrado!`);
        console.log(`Rango: ${prefix.ipv6_prefix}`);
        console.log(`Región: ${prefix.region}`);
        console.log(`Servicio: ${prefix.service}`);
        process.exit(0);
      }
    }
    console.log("\n❌ La IP no coincide con ningún rango oficial de AWS en el JSON.");
  } catch (err) {
    console.error("Error:", err);
  }
}

findAwsRegion();
