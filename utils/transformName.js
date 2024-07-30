function transformName(name) {
  // Trim any leading or trailing spaces
  name = name.trim();

  // Capitalize the first letter and lowercase the rest
  const transformedName =
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  return transformedName;
}
module.exports = transformName;
