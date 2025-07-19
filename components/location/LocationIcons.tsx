import {
  ClockIcon,
  UserGroupIcon,
  BugAntIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

export default function LocationIcons({
  family_friendly,
  petfriendly,
  free_entry,
  open_24hrs,
}) {
  return (
    <div className="flex gap-1 text-sky-500">
      {family_friendly && <UserGroupIcon className="h-5 w-5" />}
      {free_entry && <BanknotesIcon className="h-5 w-5" />}
      {petfriendly && <BugAntIcon className="h-5 w-5" />}
      {open_24hrs && <ClockIcon className="h-5 w-5" />}
    </div>
  );
}
