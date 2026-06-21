import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { contactMessageSchema, type ContactMessageInput } from "@/server/validators/contact";

// Contact-message capture (support/enquiries). Created unread; surfaced in the
// admin inbox.

export async function createContactMessage(input: ContactMessageInput) {
  const data = contactMessageSchema.parse(input);
  return db.contactMessage.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ? data.email : null,
      subject: data.subject,
      message: data.message,
    },
  });
}

export async function listContactMessages(onlyUnread = false) {
  return db.contactMessage.findMany({
    where: onlyUnread ? { isRead: false } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function unreadContactCount() {
  return db.contactMessage.count({ where: { isRead: false } });
}

export async function setContactRead(id: string, isRead = true) {
  const existing = await db.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Message not found");
  return db.contactMessage.update({ where: { id }, data: { isRead } });
}
