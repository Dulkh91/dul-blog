import type { UserProp } from "./types/userType";

export function AvatarName({ userName }: { userName: UserProp }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {userName.avatar ? (
        <img
          src={userName.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="h-9 w-9 shrink-0 rounded-full object-cover group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-4"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground">
          {(userName.name ?? userName.email).slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden" title={userName.name ?? userName.email}>
        {userName.name ?? userName.email}
      </span>
    </div>
  );
}

