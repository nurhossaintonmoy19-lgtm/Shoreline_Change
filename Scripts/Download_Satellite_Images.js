// =====================================================
// 1. STUDY AREA
// =====================================================

Map.centerObject(roi, 8);
Map.addLayer(roi, {color: 'red'}, 'Study Area');

// =====================================================
// 2. CLOUD MASK + SCALE LANDSAT C2 L2
// =====================================================

function preprocessLandsat(image) {

  var qa = image.select('QA_PIXEL');

  // Mask cloud, cloud shadow, cirrus and snow
  var mask = qa.bitwiseAnd(1 << 1).eq(0)
    .and(qa.bitwiseAnd(1 << 2).eq(0))
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0));

  // Mask saturated pixels
  var saturationMask = image.select('QA_RADSAT').eq(0);

  // Surface Reflectance Scaling
  var optical = image.select([
    'SR_B2', 'SR_B3', 'SR_B4',
    'SR_B5', 'SR_B6', 'SR_B7'
  ])
  .multiply(0.0000275)
  .add(-0.2);

  // Rename bands
  optical = optical.rename([
    'Blue', 'Green', 'Red',
    'NIR', 'SWIR1', 'SWIR2'
  ]);

  return optical
    .updateMask(mask)
    .updateMask(saturationMask)
    .copyProperties(image, ['system:time_start']);
}

// =====================================================
// 3. IMAGE COLLECTION FUNCTION
// =====================================================

function getComposite(startDate, endDate, useL9) {

  var collection8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(roi)
    .filterDate(startDate, endDate);

  var collection = collection8;

  // Include Landsat 9 if requested
  if (useL9) {
    var collection9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
      .filterBounds(roi)
      .filterDate(startDate, endDate);

    collection = collection8.merge(collection9);
  }

  var processed = collection.map(preprocessLandsat);

  print('Image count:', processed.size());

  var composite = processed.median().clip(roi);

  return composite;
}

// =====================================================
// 4. 2015 COMPOSITE
// =====================================================

var image2015 = getComposite(
  '2015-11-01',
  '2016-03-01',
  false
);

Map.addLayer(
  image2015,
  {bands: ['Red', 'Green', 'Blue'], min: 0.0, max: 0.3},
  '2015 RGB'
);

// =====================================================
// 5. 2020 COMPOSITE
// =====================================================

var image2020 = getComposite(
  '2020-11-01',
  '2021-03-01',
  false
);

Map.addLayer(
  image2020,
  {bands: ['Red', 'Green', 'Blue'], min: 0.0, max: 0.3},
  '2020 RGB'
);

// =====================================================
// 6. 2025 COMPOSITE
// =====================================================

var image2025 = getComposite(
  '2025-11-01',
  '2026-03-01',
  true
);

Map.addLayer(
  image2025,
  {bands: ['Red', 'Green', 'Blue'], min: 0.0, max: 0.3},
  '2025 RGB'
);

// =====================================================
// 7. EXPORT 2015
// =====================================================

Export.image.toDrive({
  image: image2015,
  description: 'Meghna_Landsat_2015',
  folder: 'Shoreline_Change',
  fileNamePrefix: 'Meghna_Landsat_2015',
  region: roi,
  scale: 30,
  maxPixels: 1e13
});

// =====================================================
// 8. EXPORT 2020
// =====================================================

Export.image.toDrive({
  image: image2020,
  description: 'Meghna_Landsat_2020',
  folder: 'Shoreline_Change',
  fileNamePrefix: 'Meghna_Landsat_2020',
  region: roi,
  scale: 30,
  maxPixels: 1e13
});

// =====================================================
// 9. EXPORT 2025
// =====================================================

Export.image.toDrive({
  image: image2025,
  description: 'Meghna_Landsat_2025',
  folder: 'Shoreline_Change',
  fileNamePrefix: 'Meghna_Landsat_2025',
  region: roi,
  scale: 30,
  maxPixels: 1e13
});
