export function defaultParForHole(holeNumber: number) {
  if ([1, 5, 9, 13, 17].includes(holeNumber)) {
    return 5;
  }

  if ([4, 8, 12, 16].includes(holeNumber)) {
    return 3;
  }

  return 4;
}

export function createPlaceholderHoleSetup() {
  return Array.from({ length: 18 }, (_, index) => {
    const holeNumber = index + 1;

    return {
      holeNumber,
      par: defaultParForHole(holeNumber),
      strokeIndex: holeNumber,
    };
  });
}
