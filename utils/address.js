export const composeAddress = (homeAddress, thana, district) =>
  [homeAddress, thana, district]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
