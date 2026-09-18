/**
 * NDISP Revenue & Property Intelligence — Mock Property Dataset
 * 250 realistic property records around Nalanda District (Silao, Bihar Sharif, Harnaut)
 */

const BLOCKS = [
  { id: 'BLK01', name: 'Silao', wards: ['W01', 'W02', 'W03', 'W04'], villages: ['Rajgir', 'Silao Bazar', 'Surajpur', 'Mahadeopur'] },
  { id: 'BLK02', name: 'Bihar Sharif', wards: ['W05', 'W06', 'W07', 'W08'], villages: ['Sohsarai', 'Badi Dargah', 'Ramchandrapur', 'Kaghzi Mohalla'] },
  { id: 'BLK03', name: 'Harnaut', wards: ['W01', 'W02', 'W03'], villages: ['Cheran', 'Sabait', 'Lohra', 'Pachna'] },
];

const PROPERTY_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL'];
const TAX_STATUSES = ['PAID', 'DUE', 'PARTIAL', 'ARREARS', 'EXEMPT'];
const OCCUPANCY_TYPES = ['OWNER_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT', 'MIXED'];
const USAGE_TYPES = ['RESIDENTIAL_SINGLE', 'RESIDENTIAL_MULTI', 'RETAIL_SHOP', 'OFFICE_COMPLEX', 'WAREHOUSE', 'FACTORY', 'SCHOOL', 'HOSPITAL'];

// Seeded pseudorandom generator for deterministic results
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateMockProperties() {
  const properties = [];
  let seed = 42;

  // Lat/Lng bounding box for Nalanda area: Lat 25.10 - 25.20, Lng 85.40 - 85.50
  const baseLat = 25.12;
  const baseLng = 85.44;

  for (let i = 1; i <= 250; i++) {
    const propId = `PROP-NAL-${String(i).padStart(4, '0')}`;
    const blockObj = BLOCKS[i % BLOCKS.length];
    const wardObj = blockObj.wards[i % blockObj.wards.length];
    const villageObj = blockObj.villages[i % blockObj.villages.length];
    
    // Type distribution: ~60% Res, 20% Comm, 10% Ind, 10% Inst
    const randType = pseudoRandom(seed++);
    let propertyType = 'RESIDENTIAL';
    if (randType > 0.6 && randType <= 0.8) propertyType = 'COMMERCIAL';
    else if (randType > 0.8 && randType <= 0.9) propertyType = 'INDUSTRIAL';
    else if (randType > 0.9) propertyType = 'INSTITUTIONAL';

    // Tax status distribution: ~35% Paid, 30% Due, 15% Partial, 15% Arrears, 5% Exempt
    const randStatus = pseudoRandom(seed++);
    let taxStatus = 'PAID';
    if (randStatus > 0.35 && randStatus <= 0.65) taxStatus = 'DUE';
    else if (randStatus > 0.65 && randStatus <= 0.80) taxStatus = 'PARTIAL';
    else if (randStatus > 0.80 && randStatus <= 0.95) taxStatus = 'ARREARS';
    else if (randStatus > 0.95) taxStatus = 'EXEMPT';

    // Area calculations (sq ft)
    let plotArea = Math.round(1000 + pseudoRandom(seed++) * 4000);
    let builtUpArea = Math.round(plotArea * (0.5 + pseudoRandom(seed++) * 0.8));
    if (propertyType === 'COMMERCIAL') {
      plotArea = Math.round(2000 + pseudoRandom(seed++) * 8000);
      builtUpArea = Math.round(plotArea * 1.2);
    } else if (propertyType === 'INDUSTRIAL') {
      plotArea = Math.round(10000 + pseudoRandom(seed++) * 30000);
      builtUpArea = Math.round(plotArea * 0.6);
    }

    // Financial calculations
    const baseRatePerSqFt = propertyType === 'COMMERCIAL' ? 45 : propertyType === 'INDUSTRIAL' ? 60 : 15;
    const valuation = Math.round(builtUpArea * baseRatePerSqFt * 100);
    const annualTax = Math.round(valuation * 0.005);
    
    let paidAmount = 0;
    let outstandingAmount = annualTax;
    let arrearsAmount = 0;
    let arrearsAging = null;

    if (taxStatus === 'PAID') {
      paidAmount = annualTax;
      outstandingAmount = 0;
    } else if (taxStatus === 'PARTIAL') {
      paidAmount = Math.round(annualTax * 0.4);
      outstandingAmount = annualTax - paidAmount;
    } else if (taxStatus === 'ARREARS') {
      paidAmount = 0;
      const arrearsMultiplier = 1 + pseudoRandom(seed++) * 3;
      arrearsAmount = Math.round(annualTax * arrearsMultiplier);
      outstandingAmount = annualTax + arrearsAmount;
      
      const randAge = pseudoRandom(seed++);
      if (randAge < 0.4) arrearsAging = '<1_year';
      else if (randAge < 0.7) arrearsAging = '1-3_years';
      else if (randAge < 0.9) arrearsAging = '3-5_years';
      else arrearsAging = '5+_years';
    } else if (taxStatus === 'EXEMPT') {
      paidAmount = 0;
      outstandingAmount = 0;
    }

    // Coordinates jitter
    const lat = baseLat + (pseudoRandom(seed++) - 0.5) * 0.15;
    const lng = baseLng + (pseudoRandom(seed++) - 0.5) * 0.15;

    // Assessment flags & Risk indicators
    const isAssessed = pseudoRandom(seed++) > 0.12;
    const hasUnassessedStructure = !isAssessed || pseudoRandom(seed++) > 0.85;
    const usageMismatch = pseudoRandom(seed++) > 0.88;
    const highRisk = arrearsAmount > 50000 || usageMismatch || arrearsAging === '5+_years';

    properties.push({
      id: propId,
      propertyId: propId,
      holdingNumber: `HLD-${blockObj.name.substring(0, 3).toUpperCase()}-${String(100 + i)}`,
      ownerName: `Owner ${i} (${['Kumar', 'Singh', 'Prasad', 'Sharma', 'Verma', 'Devi'][i % 6]})`,
      fatherOrHusbandName: `Parent of Owner ${i}`,
      mobileNumber: `9835${String(100050 + i).padStart(6, '0')}`,
      email: `owner${i}@example.com`,
      
      // Location
      district: 'Nalanda',
      blockId: blockObj.id,
      blockName: blockObj.name,
      wardId: wardObj,
      wardNumber: wardObj.replace('W', ''),
      villageName: villageObj,
      pincode: '803101',
      address: `House No. ${i * 3}, Ward ${wardObj.replace('W', '')}, ${villageObj}, ${blockObj.name}, Nalanda`,
      latitude: lat,
      longitude: lng,

      // Classification
      propertyType,
      usageType: USAGE_TYPES[i % USAGE_TYPES.length],
      occupancyType: OCCUPANCY_TYPES[i % OCCUPANCY_TYPES.length],
      floors: Math.min(5, Math.max(1, Math.floor(pseudoRandom(seed++) * 4) + 1)),
      
      // Spatial Measurements
      plotAreaSqFt: plotArea,
      builtUpAreaSqFt: builtUpArea,
      gisAreaSqFt: Math.round(builtUpArea * (0.95 + pseudoRandom(seed++) * 0.1)),
      areaDiscrepancySqFt: Math.round(builtUpArea * 0.1),

      // Tax & Financial
      valuationAmount: valuation,
      annualDemand: annualTax,
      paidAmount,
      outstandingAmount,
      arrearsAmount,
      arrearsAgingBucket: arrearsAging,
      taxStatus,

      // Assessment Metadata
      isAssessed,
      lastAssessmentDate: isAssessed ? `2024-04-${String((i % 25) + 1).padStart(2, '0')}` : null,
      lastAssessmentYear: isAssessed ? '2024-2025' : null,
      assessmentGap: !isAssessed || hasUnassessedStructure,

      // Risk & AI Flags
      riskScore: highRisk ? Math.round(70 + pseudoRandom(seed++) * 28) : Math.round(10 + pseudoRandom(seed++) * 40),
      isHighRisk: highRisk,
      hasUsageMismatch: usageMismatch,
      hasUnassessedStructure,
      reviewCandidate: highRisk || arrearsAmount > 30000 || usageMismatch,
      reviewReason: highRisk 
        ? (usageMismatch ? 'Commercial usage detected in residential zone' : 'High accumulated arrears > 3 years')
        : null,

      // Timestamps
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2026-08-20T14:30:00Z'
    });
  }

  return properties;
}

export const MOCK_PROPERTIES = generateMockProperties();
