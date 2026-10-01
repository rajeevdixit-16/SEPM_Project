import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export const analyzeImageWithVision = async (imageUrl) => {
  const [result] = await client.annotateImage({
    image: { source: { imageUri: imageUrl } },
    features: [
      { type: "LABEL_DETECTION", maxResults: 10 },
      { type: "OBJECT_LOCALIZATION", maxResults: 10 },
      { type: "TEXT_DETECTION" }
    ]
  });

  const labels =
    result.labelAnnotations?.map(l => l.description.toLowerCase()) || [];

  const objects =
    result.localizedObjectAnnotations?.map(o =>
      o.name.toLowerCase()
    ) || [];

  const text =
    result.textAnnotations?.[0]?.description || "";

  return { labels, objects, text };
};
