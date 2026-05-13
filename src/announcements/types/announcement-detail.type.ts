export type AnnouncementDetail = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    displayName: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
};
