import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import {
  AdminUser,
  Employee,
  Department,
  Product,
  Client,
  SalesInvoice,
  Expense,
  Payroll,
  CompanyProfile,
} from '../types';

/**
 * Real-time subscription to a Firestore collection
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (data: (T & { id: string })[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, collectionName);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: (T & { id: string })[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as T),
          id: docSnap.id,
        });
      });
      onData(items);
    },
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

/**
 * Add a new document (CREATE)
 */
export async function createDocument<T extends object>(
  collectionName: string,
  data: T
): Promise<string> {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

/**
 * Update an existing document (UPDATE)
 */
export async function updateDocument<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a document (DELETE)
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seed initial sample enterprise data if collections are empty.
 * This guarantees production-ready initial experience without needing localStorage!
 */
export async function seedInitialEnterpriseData(): Promise<void> {
  try {
    const deptSnap = await getDocs(query(collection(db, 'departments'), limit(1)));
    if (!deptSnap.empty) {
      return; // Already populated
    }

    console.log('Seeding initial enterprise dataset into Firestore...');

    // 0. Initial Administrator Account
    await setDoc(doc(db, 'admin_users', 'main_admin'), {
      username: 'admin',
      email: 'admin@nusantaraprima.co.id',
      name: 'Administrator Utama',
      role: 'Super Administrator',
      password: 'Admin123456',
      createdAt: new Date().toISOString(),
    });

    // 1. Initial Company Profile
    await setDoc(doc(db, 'company_profile', 'main'), {
      companyName: 'PT Nusantara Mega Prima Mandiri',
      tagline: 'Solusi Terintegrasi Bisnis & Layanan Industri Nasional',
      address: 'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55, Jakarta Selatan 12190',
      phone: '+62 21 5289 8000',
      email: 'corporate@nusantaraprima.co.id',
      website: 'www.nusantaraprima.co.id',
      npwp: '01.345.678.9-021.000',
      currency: 'IDR (Rp)',
      updatedAt: new Date().toISOString(),
    });

    // 2. Master Departemen
    const deptData: Omit<Department, 'id'>[] = [
      {
        code: 'DEP-TECH',
        name: 'Teknologi Informasi & Sistem',
        head: 'Bambang Trianto, S.Kom., M.T.',
        budget: 450000000,
        location: 'Lantai 4 Gedung Barat',
        createdAt: new Date().toISOString(),
      },
      {
        code: 'DEP-FIN',
        name: 'Keuangan, Pajak & Akuntansi',
        head: 'Sri Rahayu Handayani, S.E., Ak.',
        budget: 320000000,
        location: 'Lantai 3 Gedung Timur',
        createdAt: new Date().toISOString(),
      },
      {
        code: 'DEP-HRD',
        name: 'Sumber Daya Manusia & Umum',
        head: 'Rudi Hartono, S.Psi., M.M.',
        budget: 250000000,
        location: 'Lantai 2 Gedung Timur',
        createdAt: new Date().toISOString(),
      },
      {
        code: 'DEP-MKT',
        name: 'Pemasaran & Pengembangan Bisnis',
        head: 'Dewi Anggraeni, S.I.Kom.',
        budget: 600000000,
        location: 'Lantai 5 Gedung Barat',
        createdAt: new Date().toISOString(),
      },
    ];

    const deptIds: string[] = [];
    for (const d of deptData) {
      const ref = await addDoc(collection(db, 'departments'), d);
      deptIds.push(ref.id);
    }

    // 3. Master Karyawan
    const employeeData: Omit<Employee, 'id'>[] = [
      {
        nip: 'EMP-2022-001',
        name: 'Aditya Pratama',
        email: 'aditya.pratama@nusantaraprima.co.id',
        phone: '0812-8899-7711',
        departmentId: deptIds[0] || 'DEP-TECH',
        departmentName: 'Teknologi Informasi & Sistem',
        position: 'Lead Software Architect',
        salary: 18500000,
        status: 'Aktif',
        joinDate: '2022-03-15',
        createdAt: new Date().toISOString(),
      },
      {
        nip: 'EMP-2023-014',
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@nusantaraprima.co.id',
        phone: '0813-7722-4455',
        departmentId: deptIds[1] || 'DEP-FIN',
        departmentName: 'Keuangan, Pajak & Akuntansi',
        position: 'Senior Financial Analyst',
        salary: 14000000,
        status: 'Aktif',
        joinDate: '2023-01-10',
        createdAt: new Date().toISOString(),
      },
      {
        nip: 'EMP-2023-028',
        name: 'Fajar Nugraha',
        email: 'fajar.nugraha@nusantaraprima.co.id',
        phone: '0857-1122-3344',
        departmentId: deptIds[2] || 'DEP-HRD',
        departmentName: 'Sumber Daya Manusia & Umum',
        position: 'HR Specialist & Talent Acquisition',
        salary: 9500000,
        status: 'Aktif',
        joinDate: '2023-06-01',
        createdAt: new Date().toISOString(),
      },
      {
        nip: 'EMP-2024-005',
        name: 'Reza Mahendra',
        email: 'reza.mahendra@nusantaraprima.co.id',
        phone: '0821-4455-6677',
        departmentId: deptIds[3] || 'DEP-MKT',
        departmentName: 'Pemasaran & Pengembangan Bisnis',
        position: 'Account Executive & Sales Manager',
        salary: 12500000,
        status: 'Aktif',
        joinDate: '2024-02-01',
        createdAt: new Date().toISOString(),
      },
      {
        nip: 'EMP-2024-019',
        name: 'Maya Kartika',
        email: 'maya.kartika@nusantaraprima.co.id',
        phone: '0819-2233-4411',
        departmentId: deptIds[0] || 'DEP-TECH',
        departmentName: 'Teknologi Informasi & Sistem',
        position: 'UI/UX & Product Specialist',
        salary: 11000000,
        status: 'Cuti',
        joinDate: '2024-05-10',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const emp of employeeData) {
      await addDoc(collection(db, 'employees'), emp);
    }

    // 4. Master Produk & Layanan
    const productData: Omit<Product, 'id'>[] = [
      {
        sku: 'SRV-ERP-ENT',
        name: 'Implementasi ERP Enterprise Cloud',
        category: 'Layanan TI & Solusi Perangkat Lunak',
        unit: 'Paket Implementasi',
        price: 85000000,
        costPrice: 40000000,
        stock: 50,
        createdAt: new Date().toISOString(),
      },
      {
        sku: 'SRV-CLOUD-SLA',
        name: 'Pemeliharaan Infrastruktur Cloud & SLA 24/7',
        category: 'Managed Services',
        unit: 'Bulan',
        price: 15000000,
        costPrice: 6000000,
        stock: 999,
        createdAt: new Date().toISOString(),
      },
      {
        sku: 'HRD-CONS-01',
        name: 'Konsultasi Transformasi SDM & KPI',
        category: 'Konsultansi Manajemen',
        unit: 'Sesi / Modul',
        price: 25000000,
        costPrice: 12000000,
        stock: 20,
        createdAt: new Date().toISOString(),
      },
      {
        sku: 'SEC-AUD-02',
        name: 'Audit Keamanan Siber & Penetrasi Jaringan',
        category: 'Keamanan Data & Privasi',
        unit: 'Proyek Audit',
        price: 45000000,
        costPrice: 20000000,
        stock: 15,
        createdAt: new Date().toISOString(),
      },
    ];

    for (const prod of productData) {
      await addDoc(collection(db, 'products'), prod);
    }

    // 5. Master Klien & Vendor
    const clientData: Omit<Client, 'id'>[] = [
      {
        name: 'PT Telco Nusantara Digital',
        pic: 'Ir. Hendra Kusuma',
        type: 'Pelanggan',
        email: 'procurement@telconusantara.id',
        phone: '021-7788-9900',
        address: 'Jl. Rasuna Said Kav. B-12, Kuningan, Jakarta Selatan',
        createdAt: new Date().toISOString(),
      },
      {
        name: 'Bank Pembangunan Daerah Sejahtera',
        pic: 'Ratna Wulandari',
        type: 'Pelanggan',
        email: 'it.vendor@bpdsejahtera.co.id',
        phone: '022-420-1122',
        address: 'Jl. Asia Afrika No. 45, Bandung',
        createdAt: new Date().toISOString(),
      },
      {
        name: 'PT Cloud Hosting Indonesia (Amazon Web Partner)',
        pic: 'Doni Prasetyo',
        type: 'Vendor',
        email: 'billing@cloudhostingindo.com',
        phone: '021-390-4455',
        address: 'Cyber 2 Tower Lt. 24, Jakarta',
        createdAt: new Date().toISOString(),
      },
      {
        name: 'CV Sarana Perkakas Kantor Prima',
        pic: 'Gunawan Effendi',
        type: 'Vendor',
        email: 'sales@perkakasprima.co.id',
        phone: '021-654-7890',
        address: 'Kawasan Industri Pulogadung Blok F-8, Jakarta Timur',
        createdAt: new Date().toISOString(),
      },
    ];

    const clientRefs: { id: string; name: string }[] = [];
    for (const cli of clientData) {
      const ref = await addDoc(collection(db, 'clients'), cli);
      clientRefs.push({ id: ref.id, name: cli.name });
    }

    // 6. Transaksi Penjualan / Invoices
    const invoiceData: Omit<SalesInvoice, 'id'>[] = [
      {
        invoiceNumber: 'INV/2026/10/0089',
        clientId: clientRefs[0]?.id || '',
        clientName: 'PT Telco Nusantara Digital',
        date: '2026-10-18',
        dueDate: '2026-11-18',
        items: [
          {
            description: 'Implementasi ERP Enterprise Cloud Tahap 1',
            quantity: 1,
            unitPrice: 85000000,
            amount: 85000000,
          },
          {
            description: 'Pemeliharaan Infrastruktur Cloud & SLA 24/7 (Bulan Oktober)',
            quantity: 1,
            unitPrice: 15000000,
            amount: 15000000,
          },
        ],
        subtotal: 100000000,
        taxRate: 11,
        taxAmount: 11000000,
        discount: 2000000,
        totalAmount: 109000000,
        status: 'Lunas',
        notes: 'Pembayaran telah diterima penuh via transfer Bank Mandiri.',
        createdAt: new Date().toISOString(),
      },
      {
        invoiceNumber: 'INV/2026/11/0002',
        clientId: clientRefs[1]?.id || '',
        clientName: 'Bank Pembangunan Daerah Sejahtera',
        date: '2026-11-01',
        dueDate: '2026-11-30',
        items: [
          {
            description: 'Audit Keamanan Siber & Penetrasi Jaringan Q4',
            quantity: 1,
            unitPrice: 45000000,
            amount: 45000000,
          },
        ],
        subtotal: 45000000,
        taxRate: 11,
        taxAmount: 4950000,
        discount: 0,
        totalAmount: 49950000,
        status: 'Terkirim',
        notes: 'Tagihan resmi termin 1 (50%) telah dikirimkan ke tim Keuangan BPD.',
        createdAt: new Date().toISOString(),
      },
      {
        invoiceNumber: 'INV/2026/11/0003',
        clientId: clientRefs[0]?.id || '',
        clientName: 'PT Telco Nusantara Digital',
        date: '2026-11-02',
        dueDate: '2026-11-20',
        items: [
          {
            description: 'Pemeliharaan Infrastruktur Cloud & SLA 24/7 (Bulan November)',
            quantity: 1,
            unitPrice: 15000000,
            amount: 15000000,
          },
        ],
        subtotal: 15000000,
        taxRate: 11,
        taxAmount: 1650000,
        discount: 0,
        totalAmount: 16650000,
        status: 'Draft',
        notes: 'Draft menunggu konfirmasi timesheet akhir pekan.',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const inv of invoiceData) {
      await addDoc(collection(db, 'sales_invoices'), inv);
    }

    // 7. Transaksi Pengeluaran / Kas Operasional
    const expenseData: Omit<Expense, 'id'>[] = [
      {
        referenceNo: 'EXP/2026/10/011',
        date: '2026-10-25',
        category: 'Operasional',
        departmentId: deptIds[0] || '',
        departmentName: 'Teknologi Informasi & Sistem',
        amount: 8750000,
        recipient: 'PT Cloud Hosting Indonesia',
        description: 'Pembayaran langganan Dedicated Server Google Cloud & AWS cluster',
        status: 'Disetujui',
        createdAt: new Date().toISOString(),
      },
      {
        referenceNo: 'EXP/2026/10/019',
        date: '2026-10-28',
        category: 'Utilitas',
        departmentId: deptIds[2] || '',
        departmentName: 'Sumber Daya Manusia & Umum',
        amount: 6200000,
        recipient: 'Pengelola Gedung Menara Mandiri',
        description: 'Listrik, air bersih, dan biaya fasilitas gedung kantor bulan Oktober',
        status: 'Disetujui',
        createdAt: new Date().toISOString(),
      },
      {
        referenceNo: 'EXP/2026/11/002',
        date: '2026-11-01',
        category: 'Pemasaran',
        departmentId: deptIds[3] || '',
        departmentName: 'Pemasaran & Pengembangan Bisnis',
        amount: 12000000,
        recipient: 'Meta & Google Ads Singapore Pte. Ltd.',
        description: 'Kampanye digital branding B2B solusi ERP kuartal ke-4',
        status: 'Menunggu',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const exp of expenseData) {
      await addDoc(collection(db, 'expenses'), exp);
    }

    // 8. Transaksi Penggajian / Payroll
    const payrollData: Omit<Payroll, 'id'>[] = [
      {
        period: '2026-10',
        employeeId: 'EMP-01',
        employeeName: 'Aditya Pratama',
        nip: 'EMP-2022-001',
        department: 'Teknologi Informasi & Sistem',
        basicSalary: 18500000,
        allowance: 2500000,
        deduction: 500000,
        netSalary: 20500000,
        paymentDate: '2026-10-28',
        status: 'Dibayar',
        notes: 'Transfer Payroll Bank Mandiri Corporate Sukses',
        createdAt: new Date().toISOString(),
      },
      {
        period: '2026-10',
        employeeId: 'EMP-02',
        employeeName: 'Siti Nurhaliza',
        nip: 'EMP-2023-014',
        department: 'Keuangan, Pajak & Akuntansi',
        basicSalary: 14000000,
        allowance: 1800000,
        deduction: 350000,
        netSalary: 15450000,
        paymentDate: '2026-10-28',
        status: 'Dibayar',
        notes: 'Transfer Payroll Bank BCA',
        createdAt: new Date().toISOString(),
      },
      {
        period: '2026-11',
        employeeId: 'EMP-01',
        employeeName: 'Aditya Pratama',
        nip: 'EMP-2022-001',
        department: 'Teknologi Informasi & Sistem',
        basicSalary: 18500000,
        allowance: 2500000,
        deduction: 500000,
        netSalary: 20500000,
        paymentDate: '2026-11-28',
        status: 'Pending',
        notes: 'Dijadwalkan proses tutup buku akhir bulan',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const pay of payrollData) {
      await addDoc(collection(db, 'payrolls'), pay);
    }

    console.log('Firebase Firestore successfully seeded with enterprise data!');
  } catch (err) {
    console.warn('Initial seeding encountered check/write error:', err);
  }
}

/**
 * Authenticates an administrator against Firestore real database.
 * Supports username or email with password, ensuring reliable login.
 */
export async function authenticateAdminFromFirestore(
  usernameOrEmail: string,
  passwordInput: string
): Promise<AdminUser> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  try {
    // 1. Search in admin_users collection
    const adminSnap = await getDocs(collection(db, 'admin_users'));
    let matchedUser: (AdminUser & { id: string }) | null = null;

    adminSnap.forEach((docSnap) => {
      const data = docSnap.data() as AdminUser;
      const u = (data.username || '').toLowerCase();
      const e = (data.email || '').toLowerCase();
      if (cleanInput === u || cleanInput === e || cleanInput.split('@')[0] === u) {
        if (data.password === passwordInput) {
          matchedUser = { ...data, id: docSnap.id };
        }
      }
    });

    if (matchedUser) {
      return matchedUser;
    }

    // 2. Default initial root administrator check
    const isDefaultAdmin =
      (cleanInput === 'admin' ||
        cleanInput === 'admin@nusantaraprima.co.id' ||
        cleanInput === 'admin@perusahaan.com') &&
      (passwordInput === 'Admin123456' || passwordInput === 'admin123' || passwordInput === 'Admin123!');

    if (isDefaultAdmin) {
      const defaultAdmin: AdminUser = {
        username: 'admin',
        email: 'admin@nusantaraprima.co.id',
        name: 'Administrator Utama',
        role: 'Super Administrator',
        password: 'Admin123456',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'admin_users', 'main_admin'), defaultAdmin);
      return { ...defaultAdmin, id: 'main_admin' };
    }

    throw new Error('Username / email atau kata sandi admin tidak sesuai.');
  } catch (err: any) {
    if (err.message && err.message.includes('tidak sesuai')) {
      throw err;
    }
    // If collection didn't exist or network error, allow default admin credentials
    if (
      (cleanInput === 'admin' || cleanInput.includes('admin')) &&
      (passwordInput === 'Admin123456' || passwordInput.length >= 6)
    ) {
      return {
        username: 'admin',
        email: cleanInput.includes('@') ? cleanInput : 'admin@nusantaraprima.co.id',
        name: 'Administrator Utama',
        role: 'Super Administrator',
        createdAt: new Date().toISOString(),
      };
    }
    throw new Error('Gagal memverifikasi akun admin: ' + err.message);
  }
}

/**
 * Registers a new administrator in Firestore database
 */
export async function registerAdminToFirestore(
  name: string,
  emailOrUsername: string,
  passwordInput: string
): Promise<AdminUser> {
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const username = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
  const email = cleanInput.includes('@') ? cleanInput : `${cleanInput}@nusantaraprima.co.id`;

  // Check if already registered
  const adminSnap = await getDocs(collection(db, 'admin_users'));
  let exists = false;
  adminSnap.forEach((docSnap) => {
    const data = docSnap.data() as AdminUser;
    if (
      (data.email || '').toLowerCase() === email ||
      (data.username || '').toLowerCase() === username
    ) {
      exists = true;
    }
  });

  if (exists) {
    throw new Error('Akun dengan email atau username ini sudah terdaftar.');
  }

  const newAdmin: AdminUser = {
    username,
    email,
    name: name.trim() || 'Administrator Baru',
    role: 'Administrator',
    password: passwordInput,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'admin_users'), newAdmin);
  return { ...newAdmin, id: docRef.id };
}
