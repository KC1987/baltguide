"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
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

import {
  User,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";

import NextLink from "next/link";
import clsx from "clsx";
import localFont from "next/font/local";

import { AuthContext } from "@/contexts/AuthContext";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import LanguageSelector from "@/components/LanguageSelector";
import TranslationProvider from "@/components/TranslationProvider";
import { useTranslation } from "@/lib/i18n";
import { GithubIcon, SearchIcon } from "@/components/icons";
import { createClient } from "@/config/supabase/client";

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
  const supabase = createClient();
  const router = useRouter();
  const { session, user, loading } = useContext(AuthContext);
  const { t } = useTranslation();

  // Handle dropdown selection
  const handleDropdownSelection = (key) => {
    if (Array.from(key)[0] === "/") {
      router.push(key);
    }
  };

  function handleLogOut() {
    supabase.auth.signOut();
  }

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
          {/* <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link> */}
        </NavbarItem>
        <NavbarItem className="hidden sm:flex items-center gap-2">
          <LanguageSelector />
          <Button size="sm" onPress={() => console.log(user, session)}>
            Log Session
          </Button>
        </NavbarItem>
        {/* <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem> */}

        {user ? (
          <NavbarItem className="hidden md:flex">
            <Dropdown>
              <DropdownTrigger>
                <User
                  // avatarProps={{
                  //   src: "https://i.pravatar.cc/150?u=a04258114e29026702d",
                  // }}
                  className="hover:cursor-pointer"
                  description="Product Designer"
                  name={user.user_metadata.username || "User"}
                />
              </DropdownTrigger>
              <DropdownMenu onAction={handleDropdownSelection}>
                <DropdownSection showDivider>
                  <DropdownItem key="theme">
                    <ThemeSwitch />
                  </DropdownItem>
                </DropdownSection>
                <DropdownItem
                  key="/account/profile"
                  className="min-w-[100] min-h-[40]"
                >
                  Profile
                </DropdownItem>
                <DropdownItem
                  key="/account/favourites"
                  className="min-w-[100] min-h-[40]"
                >
                  Favourites
                </DropdownItem>
                <DropdownItem
                  key="/account/settings"
                  showDivider
                  className="min-w-[100] min-h-[40]"
                >
                  Settings
                </DropdownItem>
                <DropdownItem
                  key="/login"
                  className="text-red-400 min-w-[100] min-h-[40]"
                  onClick={handleLogOut}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <div>
            <NavbarItem className="hidden md:flex gap-2">
              <Button as={Link} color="warning" href="/login" size="sm">
                Login
              </Button>
              <Button as={Link} color="secondary" href="/register" size="sm">
                Register
              </Button>
            </NavbarItem>
          </div>
        )}
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
