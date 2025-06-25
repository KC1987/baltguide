export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Baltguide",
  description: "Your trusty guide into the Baltics",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Add",
      href: "/add",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "Login",
      href: "/login",
    },
    {
      label: "Account",
      href: "/account",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
