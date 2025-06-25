"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Button } from "@heroui/button";

export default function LightBox({ imageUrls }: any) {
  const [open, setOpen] = useState(false);

  const images = imageUrls?.map((url) => ({ src: url }));

  return (
    <div>
      <Button
        color="secondary"
        size="lg"
        variant="ghost"
        onPress={() => setOpen(true)}
      >
        Open Lightbox
      </Button>
      <Lightbox
        slides={images}
        open={open}
        // plugins={[Thumbnails]}
        close={() => setOpen(false)}
      />
    </div>
  );
}
