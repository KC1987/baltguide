"use client";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Button,
} from "@heroui/react";
import { HeartIcon as Heart_s } from "@heroicons/react/24/solid";

export default function LocationCard({ data }: any) {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <h1>{data.name}</h1>
      </CardHeader>
      <Divider />
      <CardBody>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Mollitia,
          qui animi, quaerat sapiente sed necessitatibus consequuntur pariatur
          doloremque quidem odit vero nostrum saepe perspiciatis quas, soluta
          consectetur aut. Dolorem, ex.
        </p>
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-between">
        <Button>Details</Button>
        <Divider orientation="vertical" />
        <Heart_s className="size-8 text-red-600" />
      </CardFooter>
    </Card>
  );
}
