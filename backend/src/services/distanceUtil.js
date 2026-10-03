/**
 * Haversine Formula Distance Utility (Kilometers)
 */

function distanceKm(lat1, lng1, lat2, lng2) {
  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);

  if (isNaN(nLat1) || isNaN(nLng1) || isNaN(nLat2) || isNaN(nLng2)) {
    return null;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLng = (nLng2 - nLng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(nLat1 * Math.PI / 180) *
      Math.cos(nLat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

module.exports = {
  distanceKm
};
