export interface Cistern {
  id?: number;
  cisternNumber: number;
  capacity: number; // in Liters
}

export interface Truck {
  id?: number;
  externalCode?: string;
  patent: string;
  description?: string;
  cisterns: Cistern[];
}

export interface Driver {
  id?: number;
  externalCode?: string;
  name: string;
  lastName: string;
  document?: string;
}

export interface Customer {
  id?: number;
  externalCode?: string;
  businessName: string; // Razón Social
  contact?: string;
}

export interface Product {
  id?: number;
  externalCode?: string;
  name: string;
  description?: string;
}
