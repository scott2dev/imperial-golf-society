export type FixtureRecord = {
  id: string;
  title: string;
  date: string;
  course: string;
  courseWebsiteUrl: string;
  teeTime: string;
  imageSrc: string;
  imageAlt: string;
  mapsUrl: string;
  sponsorName: string;
  sponsorUrl: string;
  featured?: boolean;
};

export const fixtures: FixtureRecord[] = [
  {
    id: "first-outing-april-19",
    title: "First Outing",
    date: "April 19",
    course: "Kirkistown",
    courseWebsiteUrl: "https://kcgc.golf/",
    teeTime: "11.00am",
    imageSrc: "/kirkistown.jpg",
    imageAlt: "Kirkistown Castle Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirkistown+Castle+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-may-31",
    title: "Monthly Outing",
    date: "May 31",
    course: "Lurgan",
    courseWebsiteUrl: "https://www.lurgangolfclub.com/",
    teeTime: "12.30pm",
    imageSrc: "/lurgan.webp",
    imageAlt: "Lurgan Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lurgan+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-june-28",
    title: "Monthly Outing",
    date: "June 28",
    course: "Clandeboye",
    courseWebsiteUrl: "https://www.cgc-ni.com/",
    teeTime: "10.58am",
    imageSrc: "/Clandeboye.jpg",
    imageAlt: "Clandeboye Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Clandeboye+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-july-26",
    title: "Monthly Outing",
    date: "July 26",
    course: "Cairndhu",
    courseWebsiteUrl: "https://www.cairndhugolfclub.co.uk/",
    teeTime: "10.30am",
    imageSrc: "/cairndhu.jpg",
    imageAlt: "Cairndhu Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cairndhu+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-august-23",
    title: "Monthly Outing",
    date: "August 23",
    course: "Dunmurry",
    courseWebsiteUrl: "https://www.dunmurrygolfclub.com/",
    teeTime: "11.04am",
    imageSrc: "/dunmurry.jpg",
    imageAlt: "Dunmurry Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dunmurry+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "captains-weekend-september-26-27",
    title: "Captain's Weekend",
    date: "Sept 26 & 27",
    course: "Slieve Russell",
    courseWebsiteUrl: "https://www.slieverussell.ie/",
    teeTime: "11.00am both days",
    featured: true,
    imageSrc: "/slieverussell.jpg",
    imageAlt: "Slieve Russell golf course",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Slieve+Russell+Hotel+Golf+%26+Country+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "october-bangor-tbc",
    title: "October Outing",
    date: "October",
    course: "Bangor",
    courseWebsiteUrl: "https://www.bgcni.co.uk/",
    teeTime: "TBC",
    imageSrc: "/bangor.jpg",
    imageAlt: "Bangor Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bangor+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
];
