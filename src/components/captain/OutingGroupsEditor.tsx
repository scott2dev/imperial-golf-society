"use client";

import { useEffect, useMemo, useState } from "react";

type GroupMemberOption = {
  id: string;
  name: string;
  handicapIndex: number;
};

type OutingGroupsEditorProps = {
  members: GroupMemberOption[];
  initialGroups: string[][];
};

function createEmptySlotGroup() {
  return [""];
}

export default function OutingGroupsEditor({
  members,
  initialGroups,
}: OutingGroupsEditorProps) {
  const normalizedInitialGroups = useMemo(
    () => (initialGroups.length > 0 ? initialGroups : []),
    [initialGroups],
  );
  const [groups, setGroups] = useState<string[][]>(normalizedInitialGroups);

  useEffect(() => {
    setGroups(normalizedInitialGroups);
  }, [normalizedInitialGroups]);

  function updateMember(groupIndex: number, memberIndex: number, memberId: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) {
          return group;
        }

        return group.map((currentMemberId, currentMemberIndex) =>
          currentMemberIndex === memberIndex ? memberId : currentMemberId,
        );
      }),
    );
  }

  function addGroup() {
    setGroups((currentGroups) => [...currentGroups, createEmptySlotGroup()]);
  }

  function removeGroup(groupIndex: number) {
    setGroups((currentGroups) =>
      currentGroups.filter((_, currentGroupIndex) => currentGroupIndex !== groupIndex),
    );
  }

  function addMemberSlot(groupIndex: number) {
    setGroups((currentGroups) =>
      currentGroups.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex || group.length >= 4) {
          return group;
        }

        return [...group, ""];
      }),
    );
  }

  function removeMemberSlot(groupIndex: number, memberIndex: number) {
    setGroups((currentGroups) =>
      currentGroups.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) {
          return group;
        }

        const nextGroup = group.filter(
          (_, currentMemberIndex) => currentMemberIndex !== memberIndex,
        );
        return nextGroup.length > 0 ? nextGroup : createEmptySlotGroup();
      }),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Build the groups visually. Each group can hold up to four members, and
          once someone is placed in a slot they disappear from the other dropdowns.
        </p>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
        >
          Add group tile
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-5 text-sm text-slate-600">
          No groups added yet. Create a group tile when you know who is attending.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group, groupIndex) => (
            <article
              key={`group-${groupIndex + 1}`}
              className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,_rgba(244,241,234,0.96)_0%,_rgba(232,227,214,0.98)_100%)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                    Group {groupIndex + 1}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {group.filter(Boolean).length} of 4 places filled
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addMemberSlot(groupIndex)}
                    disabled={group.length >= 4}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl font-medium text-[var(--brand-dark)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Add member to group ${groupIndex + 1}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Remove group
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {group.map((memberId, memberIndex) => {
                  const selectedByOtherSlots = new Set(
                    groups.flatMap((otherGroup, otherGroupIndex) =>
                      otherGroup.flatMap((otherMemberId, otherMemberIndex) => {
                        if (
                          otherGroupIndex === groupIndex &&
                          otherMemberIndex === memberIndex
                        ) {
                          return [];
                        }

                        return otherMemberId ? [otherMemberId] : [];
                      }),
                    ),
                  );
                  const selectedMember =
                    members.find((member) => member.id === memberId) ?? null;

                  return (
                    <div
                      key={`group-${groupIndex + 1}-member-${memberIndex + 1}`}
                      className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.42)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="block flex-1 text-sm font-semibold text-[var(--brand-dark)]">
                          Player {memberIndex + 1}
                          <select
                            name={`group-${groupIndex + 1}-member-${memberIndex + 1}`}
                            value={memberId}
                            onChange={(event) =>
                              updateMember(groupIndex, memberIndex, event.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                          >
                            <option value="">Select member</option>
                            {members
                              .filter(
                                (member) =>
                                  !selectedByOtherSlots.has(member.id) || member.id === memberId,
                              )
                              .map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} ({member.handicapIndex.toFixed(1)})
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeMemberSlot(groupIndex, memberIndex)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg font-medium text-slate-600 transition hover:bg-white"
                          aria-label={`Remove player ${memberIndex + 1} from group ${groupIndex + 1}`}
                        >
                          -
                        </button>
                      </div>
                      {selectedMember ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {selectedMember.name} is in this group with a handicap of{" "}
                          {selectedMember.handicapIndex.toFixed(1)}.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
