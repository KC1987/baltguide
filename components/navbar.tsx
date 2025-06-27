"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import { DividerProps, User } from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";
import localFont from "next/font/local";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import LanguageSelector from "@/components/LanguageSelector";
import TranslationProvider from "@/components/TranslationProvider";
import { useTranslation } from "@/lib/i18n";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons";

const bauhaus = localFont({
  src: [
    {
      path: "../public/fonts/BauhausRegular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/BauhausBold.ttf",
      weight: "700",
      style: "bold",
    },
  ],
});

function NavbarMain() {
  const { session, user, loading } = useContext(AuthContext);
  const { t } = useTranslation();

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder={t("common.search")}
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            {/* <Logo /> */}
            <p
              className={`${bauhaus.className} text-sky-400 dark:text-sky-400 text-3xl font-bold`}
            >
              Baltguide
            </p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden sm:flex">
          <LanguageSelector />
        </NavbarItem>
        {/* <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem> */}


        {user ? (
          <NavbarItem className="hidden md:flex">
            <Button
              // isExternal
              as={Link}
              className="text-sm font-normal text-default-600 bg-default-100"
              href="/account"
              // startContent={<HeartFilledIcon className="text-danger" />}
              variant="flat"
            >
              <User
                avatarProps={{
                  src: "https://i.pravatar.cc/150?u=a04258114e29026702d",
                }}
                description="Product Designer"
                name="Jane Doe"
              />
            </Button>
          </NavbarItem>
        ) : (
        <div>
          <NavbarItem className="hidden md:flex gap-2">
            <Button href="/login" as={Link} color="warning" size="sm" >Login</Button>
            <Button href="/register" as={Link} color="secondary" size="sm" >Register</Button>
          </NavbarItem>
        </div>
        )}
        <NavbarItem>
          <Button onPress={() => console.log(user, session)} size="sm" >Log Session</Button>
        </NavbarItem>








      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
}

export const Navbar = () => {
  return (
    <TranslationProvider>
      <NavbarMain />
    </TranslationProvider>
  );
};
