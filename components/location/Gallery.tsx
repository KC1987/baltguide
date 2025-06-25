"use client";

import { useState } from "react";
import { Image, ScrollShadow } from "@heroui/react";
import { Modal, ModalContent, useDisclosure } from "@heroui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function Gallery({ images }: any) {
  const [activeImg, setActiveImg] = useState(0);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="w-full h-full flex gap-2">
      {/* Thumbnails  */}
      <ScrollShadow className="w-96" orientation="vertical" hideScrollBar >
        <div className="flex flex-wrap justify-start content-start gap-2">
          {images?.map((img: any, i: any) => (
            <Image
              key={i}
              className="rounded-sm hover:cursor-pointer shadow-md object-cover overflow-hidden"
              src={`${images[i].url}`}
              width={140}
              height={80}
              onClick={() => setActiveImg(i)}
            />
          ))}
        </div>
      </ScrollShadow>

      {/* Main */}
      <div className="flex justify-center w-full">
        <Image
          className="block object-fill h-[500] rounded-sm shdow-md"
          src={`${images[activeImg].url}`}
          onClick={onOpen}
        />
      </div>

      <Modal
        backdrop="opaque"
        className="bg-opacity-0 border-none shadow-none"
        size="5xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent className="w-full h-full" >
          {(onClose) => (
            <div>
              <div className="flex flex-col items-center">
                <div className="flex align-middle">
                  <ChevronLeftIcon className="text-white text-sm" />
                  <Image className="w-full" src={`${images[activeImg].url}`} />
                  <ChevronRightIcon className="text-white text-sm" />
                </div>
                <p className="text-white">{images[activeImg].caption}</p>
              </div>
              <ScrollShadow className="" orientation="horizontal" >
                <div className="flex flex-row gap-2" >
                  {images?.map((img: any, i: any) => (
                    <Image
                      key={i}
                      className="rounded-sm hover:cursor-pointer shadow-md object-cover overflow-hidden"
                      src={`${images[i].url}`}
                      width={140}
                      height={80}
                      onClick={() => setActiveImg(i)}
                    />
                  ))}
                </div>
              </ScrollShadow>
            </div>
          )}
        </ModalContent>
        {/* <ModalFooter>
          <p>Caption goes here</p>
        </ModalFooter> */}
      </Modal>
    </div>
  );
}

