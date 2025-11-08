export interface Guardian {
  name: string;
  relationship: string;
  phone: string;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  teacher: string;
  guardians: Guardian[];
  grade?: string;
  parentName?: string;
  parentRelationship?: string;
  email?: string;
  phone?: string;
  className?: string;
  classId?: string;
}
