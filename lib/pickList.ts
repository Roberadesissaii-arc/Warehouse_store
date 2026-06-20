/** User-facing copy for the robot pick queue (not a shopping cart). */
export const pickListCopy = {
  title: "Pick list",
  titleYour: "Your pick list",
  add: "Add to pick list",
  addShort: "Add to pick",
  buttonAdded: "Added",
  added: (name: string) => `Queued ${name} for robot pick`,
  addedQty: (qty: number, name: string) => `Queued ${qty}× ${name} for robot pick`,
  empty: "Pick list is empty",
  emptyLead: "Nothing queued for pick yet",
  emptyHint: "Browse your warehouse stock and queue what you want picked from the shelf.",
  dispatch: "Review & send pick",
  reviewTitle: "Review your pick",
  reviewLead: "Check every line, speed, and note before sending to the floor.",
  reviewConfirm: "Send pick to floor",
  reviewBack: "Edit pick list",
  itemCount: (count: number) =>
    count === 0
      ? "Nothing queued yet"
      : count === 1
        ? "1 item queued for pick"
        : `${count} items queued for pick`,
  close: "Close pick list",
  open: "Open pick list",
  view: "View pick list",
  reviewFull: "Open full pick list",
  clear: "Clear pick list",
  itemsHeading: "Items to pick",
  browseInventory: "Browse inventory",
} as const;
