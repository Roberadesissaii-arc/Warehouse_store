/** Central paths for static images under /public/images */
export const storeImages = {
  auth: {
    signInWarehouse: "/images/auth/sign-in-warehouse.svg",
  },
  pickList: {
    emptyHero: "/images/pick-list/empty-hero.svg",
  },
  errors: {
    notFound: "/images/errors/not-found.svg",
    serverError: "/images/errors/server-error.svg",
  },
} as const;
