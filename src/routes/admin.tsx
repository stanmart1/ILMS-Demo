import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageShell, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  staffUsers as initialStaffUsers,
  patrons as initialPatrons,
  patronCategories as initialPatronCategories,
  itemTypes as initialItemTypes,
  branches as initialBranches,
  circulationRules as initialCircRules,
  fineRules as initialFineRules,
} from "@/lib/mock-data";
import type {
  StaffUser,
  Patron,
  PatronCategory,
  ItemType,
  Branch,
  CirculationRule,
  FineRule,
} from "@/lib/mock-data";

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — Athenaeum" }] }),
  component: Admin,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let _idSeq = 9000;
function genId(prefix: string) {
  return `${prefix}${++_idSeq}`;
}

function genCardNumber() {
  return `C-${Math.floor(100000 + Math.random() * 900000)}`;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const patronSchema = z.object({
  cardNumber: z.string().min(1, "Required"),
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string(),
  address: z.string(),
  category: z.enum(["Adult", "Student", "Senior", "Juvenile", "Staff"]),
  status: z.enum(["Active", "Suspended", "Expired"]),
  dob: z.string(),
});
type PatronFormValues = z.infer<typeof patronSchema>;

const staffSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["Admin", "Librarian", "Cataloger", "Circulation Clerk"]),
  branch: z.enum(["Central", "Riverside", "North Hill"]),
});
type StaffFormValues = z.infer<typeof staffSchema>;

const patronCategorySchema = z.object({
  name: z.string().min(1, "Required"),
  loanPeriod: z.coerce.number().int().min(0, "Must be ≥ 0"),
  maxCheckouts: z.coerce.number().int().min(1, "Must be ≥ 1"),
  maxRenewals: z.coerce.number().int().min(0, "Must be ≥ 0"),
  finePerDay: z.coerce.number().min(0, "Must be ≥ 0"),
  registrationFee: z.coerce.number().min(0, "Must be ≥ 0"),
  description: z.string(),
});
type PatronCategoryFormValues = z.infer<typeof patronCategorySchema>;

const itemTypeSchema = z.object({
  code: z.string().min(1, "Required").max(10),
  description: z.string().min(1, "Required"),
  loanPeriod: z.coerce.number().int().min(0),
  renewals: z.coerce.number().int().min(0),
  finePerDay: z.coerce.number().min(0),
  notForLoan: z.boolean(),
});
type ItemTypeFormValues = z.infer<typeof itemTypeSchema>;

const branchSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  manager: z.string().min(1, "Required"),
  active: z.boolean(),
});
type BranchFormValues = z.infer<typeof branchSchema>;

const circRuleSchema = z.object({
  patronCategory: z.string().min(1, "Required"),
  itemType: z.string().min(1, "Required"),
  loanDays: z.coerce.number().int().min(0),
  renewals: z.coerce.number().int().min(0),
  finePerDay: z.coerce.number().min(0),
  maxCheckouts: z.coerce.number().int().min(1),
  holdable: z.boolean(),
});
type CircRuleFormValues = z.infer<typeof circRuleSchema>;

const fineRuleSchema = z.object({
  patronCategory: z.string().min(1, "Required"),
  itemType: z.string().min(1, "Required"),
  finePerDay: z.coerce.number().min(0),
  graceDays: z.coerce.number().int().min(0),
  maxFine: z.coerce.number().min(0),
  lostAfterDays: z.coerce.number().int().min(1),
  lostFee: z.coerce.number().min(0),
});
type FineRuleFormValues = z.infer<typeof fineRuleSchema>;

// ── PatronDialog ──────────────────────────────────────────────────────────────

type PatronDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editPatron: Patron | null;
  onSave: (p: Patron) => void;
};

function PatronDialog({ open, onOpenChange, editPatron, onSave }: PatronDialogProps) {
  const form = useForm<PatronFormValues>({
    resolver: zodResolver(patronSchema),
    defaultValues: {
      cardNumber: genCardNumber(),
      name: "",
      email: "",
      phone: "",
      address: "",
      category: "Adult",
      status: "Active",
      dob: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editPatron
          ? {
              cardNumber: editPatron.cardNumber,
              name: editPatron.name,
              email: editPatron.email,
              phone: "",
              address: "",
              category: editPatron.category,
              status: editPatron.status,
              dob: "",
            }
          : {
              cardNumber: genCardNumber(),
              name: "",
              email: "",
              phone: "",
              address: "",
              category: "Adult",
              status: "Active",
              dob: "",
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editPatron]);

  function onSubmit(values: PatronFormValues) {
    const patron: Patron = {
      id: editPatron?.id ?? genId("p"),
      cardNumber: values.cardNumber,
      name: values.name,
      email: values.email,
      category: values.category,
      status: values.status,
      fines: editPatron?.fines ?? 0,
      joined: editPatron?.joined ?? new Date().toISOString().split("T")[0],
    };
    onSave(patron);
    onOpenChange(false);
    toast.success(editPatron ? "Patron updated" : "Patron registered");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editPatron ? "Edit patron" : "Register patron"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card number</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["Adult", "Student", "Senior", "Juvenile", "Staff"] as const).map(
                          (c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["Active", "Suspended", "Expired"] as const).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editPatron ? "Save changes" : "Register"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── StaffDialog ───────────────────────────────────────────────────────────────

type StaffDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editUser: StaffUser | null;
  onSave: (u: StaffUser) => void;
};

function StaffDialog({ open, onOpenChange, editUser, onSave }: StaffDialogProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: "", email: "", role: "Librarian", branch: "Central" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editUser
          ? {
              name: editUser.name,
              email: editUser.email,
              role: editUser.role,
              branch: editUser.branch as "Central" | "Riverside" | "North Hill",
            }
          : { name: "", email: "", role: "Librarian", branch: "Central" }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editUser]);

  function onSubmit(values: StaffFormValues) {
    const user: StaffUser = {
      id: editUser?.id ?? genId("u"),
      name: values.name,
      email: values.email,
      role: values.role,
      branch: values.branch,
      lastLogin: editUser?.lastLogin ?? "—",
    };
    onSave(user);
    onOpenChange(false);
    toast.success(editUser ? "Staff user updated" : "Staff user added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editUser ? "Edit staff user" : "Add staff user"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          ["Admin", "Librarian", "Cataloger", "Circulation Clerk"] as const
                        ).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["Central", "Riverside", "North Hill"] as const).map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editUser ? "Save changes" : "Add user"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── PatronCategoryDialog ──────────────────────────────────────────────────────

type PatronCategoryDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editCategory: PatronCategory | null;
  onSave: (c: PatronCategory) => void;
};

function PatronCategoryDialog({
  open,
  onOpenChange,
  editCategory,
  onSave,
}: PatronCategoryDialogProps) {
  const form = useForm<PatronCategoryFormValues>({
    resolver: zodResolver(patronCategorySchema),
    defaultValues: {
      name: "",
      loanPeriod: 28,
      maxCheckouts: 30,
      maxRenewals: 2,
      finePerDay: 0.25,
      registrationFee: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editCategory
          ? {
              name: editCategory.name,
              loanPeriod: editCategory.loanPeriod,
              maxCheckouts: editCategory.maxCheckouts,
              maxRenewals: editCategory.maxRenewals,
              finePerDay: editCategory.finePerDay,
              registrationFee: editCategory.registrationFee,
              description: editCategory.description,
            }
          : {
              name: "",
              loanPeriod: 28,
              maxCheckouts: 30,
              maxRenewals: 2,
              finePerDay: 0.25,
              registrationFee: 0,
              description: "",
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editCategory]);

  function onSubmit(values: PatronCategoryFormValues) {
    const category: PatronCategory = {
      id: editCategory?.id ?? genId("pc"),
      ...values,
    };
    onSave(category);
    onOpenChange(false);
    toast.success(editCategory ? "Category updated" : "Category added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editCategory ? "Edit patron type" : "Add patron type"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="loanPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan period (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxCheckouts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max checkouts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxRenewals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max renewals</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="finePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine / day ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration fee ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editCategory ? "Save changes" : "Add category"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── ItemTypeDialog ────────────────────────────────────────────────────────────

type ItemTypeDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItemType: ItemType | null;
  onSave: (t: ItemType) => void;
};

function ItemTypeDialog({ open, onOpenChange, editItemType, onSave }: ItemTypeDialogProps) {
  const form = useForm<ItemTypeFormValues>({
    resolver: zodResolver(itemTypeSchema),
    defaultValues: {
      code: "",
      description: "",
      loanPeriod: 28,
      renewals: 2,
      finePerDay: 0.25,
      notForLoan: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editItemType
          ? {
              code: editItemType.code,
              description: editItemType.description,
              loanPeriod: editItemType.loanPeriod,
              renewals: editItemType.renewals,
              finePerDay: editItemType.finePerDay,
              notForLoan: editItemType.notForLoan,
            }
          : { code: "", description: "", loanPeriod: 28, renewals: 2, finePerDay: 0.25, notForLoan: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItemType]);

  function onSubmit(values: ItemTypeFormValues) {
    const itemType: ItemType = {
      id: editItemType?.id ?? genId("it"),
      ...values,
    };
    onSave(itemType);
    onOpenChange(false);
    toast.success(editItemType ? "Item type updated" : "Item type added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItemType ? "Edit item type" : "Add item type"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="loanPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan period (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewals</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine / day ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notForLoan"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Not for loan</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editItemType ? "Save changes" : "Add item type"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── BranchDialog ──────────────────────────────────────────────────────────────

type BranchDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editBranch: Branch | null;
  onSave: (b: Branch) => void;
};

function BranchDialog({ open, onOpenChange, editBranch, onSave }: BranchDialogProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", address: "", phone: "", email: "", manager: "", active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editBranch
          ? {
              name: editBranch.name,
              address: editBranch.address,
              phone: editBranch.phone,
              email: editBranch.email,
              manager: editBranch.manager,
              active: editBranch.active,
            }
          : { name: "", address: "", phone: "", email: "", manager: "", active: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editBranch]);

  function onSubmit(values: BranchFormValues) {
    const branch: Branch = {
      id: editBranch?.id ?? genId("br"),
      ...values,
    };
    onSave(branch);
    onOpenChange(false);
    toast.success(editBranch ? "Branch updated" : "Branch added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editBranch ? "Edit branch" : "Add branch"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editBranch ? "Save changes" : "Add branch"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── CircRuleDialog ────────────────────────────────────────────────────────────

type CircRuleDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editRule: CirculationRule | null;
  onSave: (r: CirculationRule) => void;
};

function CircRuleDialog({ open, onOpenChange, editRule, onSave }: CircRuleDialogProps) {
  const form = useForm<CircRuleFormValues>({
    resolver: zodResolver(circRuleSchema),
    defaultValues: {
      patronCategory: "Adult",
      itemType: "Book",
      loanDays: 28,
      renewals: 2,
      finePerDay: 0.25,
      maxCheckouts: 30,
      holdable: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editRule
          ? {
              patronCategory: editRule.patronCategory,
              itemType: editRule.itemType,
              loanDays: editRule.loanDays,
              renewals: editRule.renewals,
              finePerDay: editRule.finePerDay,
              maxCheckouts: editRule.maxCheckouts,
              holdable: editRule.holdable,
            }
          : {
              patronCategory: "Adult",
              itemType: "Book",
              loanDays: 28,
              renewals: 2,
              finePerDay: 0.25,
              maxCheckouts: 30,
              holdable: true,
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editRule]);

  function onSubmit(values: CircRuleFormValues) {
    const rule: CirculationRule = {
      id: editRule?.id ?? genId("cr"),
      ...values,
    };
    onSave(rule);
    onOpenChange(false);
    toast.success(editRule ? "Circulation rule updated" : "Circulation rule added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editRule ? "Edit circulation rule" : "Add circulation rule"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="patronCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patron category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="loanDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewals</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="finePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine / day ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxCheckouts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max checkouts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="holdable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Holdable</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editRule ? "Save changes" : "Add rule"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── FineRuleDialog ────────────────────────────────────────────────────────────

type FineRuleDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editRule: FineRule | null;
  onSave: (r: FineRule) => void;
};

function FineRuleDialog({ open, onOpenChange, editRule, onSave }: FineRuleDialogProps) {
  const form = useForm<FineRuleFormValues>({
    resolver: zodResolver(fineRuleSchema),
    defaultValues: {
      patronCategory: "Adult",
      itemType: "Book",
      finePerDay: 0.25,
      graceDays: 1,
      maxFine: 10.0,
      lostAfterDays: 90,
      lostFee: 30.0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editRule
          ? {
              patronCategory: editRule.patronCategory,
              itemType: editRule.itemType,
              finePerDay: editRule.finePerDay,
              graceDays: editRule.graceDays,
              maxFine: editRule.maxFine,
              lostAfterDays: editRule.lostAfterDays,
              lostFee: editRule.lostFee,
            }
          : {
              patronCategory: "Adult",
              itemType: "Book",
              finePerDay: 0.25,
              graceDays: 1,
              maxFine: 10.0,
              lostAfterDays: 90,
              lostFee: 30.0,
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editRule]);

  function onSubmit(values: FineRuleFormValues) {
    const rule: FineRule = {
      id: editRule?.id ?? genId("fr"),
      ...values,
    };
    onSave(rule);
    onOpenChange(false);
    toast.success(editRule ? "Fine rule updated" : "Fine rule added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editRule ? "Edit fine rule" : "Add fine rule"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="patronCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patron category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="finePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine / day ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="graceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxFine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max fine ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lostAfterDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lost after (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lostFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lost fee ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editRule ? "Save changes" : "Add rule"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Admin component ───────────────────────────────────────────────────────────

function Admin() {
  // ── data state ────────────────────────────────────────────────────────────
  const [staffList, setStaffList] = useState<StaffUser[]>(initialStaffUsers);
  const [patronList, setPatronList] = useState<Patron[]>(initialPatrons);
  const [categoryList, setCategoryList] = useState<PatronCategory[]>(initialPatronCategories);
  const [itemTypeList, setItemTypeList] = useState<ItemType[]>(initialItemTypes);
  const [branchList, setBranchList] = useState<Branch[]>(initialBranches);
  const [circRuleList, setCircRuleList] = useState<CirculationRule[]>(initialCircRules);
  const [fineRuleList, setFineRuleList] = useState<FineRule[]>(initialFineRules);

  // ── dialog open + edit-target state ──────────────────────────────────────
  const [staffDialog, setStaffDialog] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffUser | null>(null);

  const [patronDialog, setPatronDialog] = useState(false);
  const [editPatron, setEditPatron] = useState<Patron | null>(null);

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<PatronCategory | null>(null);

  const [itemTypeDialog, setItemTypeDialog] = useState(false);
  const [editItemType, setEditItemType] = useState<ItemType | null>(null);

  const [branchDialog, setBranchDialog] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  const [circRuleDialog, setCircRuleDialog] = useState(false);
  const [editCircRule, setEditCircRule] = useState<CirculationRule | null>(null);

  const [fineRuleDialog, setFineRuleDialog] = useState(false);
  const [editFineRule, setEditFineRule] = useState<FineRule | null>(null);

  // ── save handlers ─────────────────────────────────────────────────────────
  function saveStaff(user: StaffUser) {
    setStaffList((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.map((u) => (u.id === user.id ? user : u))
        : [...prev, user]
    );
  }

  function savePatron(patron: Patron) {
    setPatronList((prev) =>
      prev.some((p) => p.id === patron.id)
        ? prev.map((p) => (p.id === patron.id ? patron : p))
        : [...prev, patron]
    );
  }

  function saveCategory(cat: PatronCategory) {
    setCategoryList((prev) =>
      prev.some((c) => c.id === cat.id)
        ? prev.map((c) => (c.id === cat.id ? cat : c))
        : [...prev, cat]
    );
  }

  function saveItemType(it: ItemType) {
    setItemTypeList((prev) =>
      prev.some((i) => i.id === it.id)
        ? prev.map((i) => (i.id === it.id ? it : i))
        : [...prev, it]
    );
  }

  function saveBranch(b: Branch) {
    setBranchList((prev) =>
      prev.some((br) => br.id === b.id)
        ? prev.map((br) => (br.id === b.id ? b : br))
        : [...prev, b]
    );
  }

  function saveCircRule(r: CirculationRule) {
    setCircRuleList((prev) =>
      prev.some((cr) => cr.id === r.id)
        ? prev.map((cr) => (cr.id === r.id ? r : cr))
        : [...prev, r]
    );
  }

  function saveFineRule(r: FineRule) {
    setFineRuleList((prev) =>
      prev.some((fr) => fr.id === r.id)
        ? prev.map((fr) => (fr.id === r.id ? r : fr))
        : [...prev, r]
    );
  }

  return (
    <PageShell
      title="Administration"
      description="System configuration, staff and patron management."
    >
      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff users" value={staffList.length} />
        <StatCard label="Patrons" value={patronList.length} accent="accent" />
        <StatCard
          label="Active branches"
          value={branchList.filter((b) => b.active).length}
          accent="success"
        />
        <StatCard label="System uptime" value="99.98%" accent="success" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <Tabs defaultValue="staff">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="staff">Staff &amp; roles</TabsTrigger>
              <TabsTrigger value="patrons">Patrons</TabsTrigger>
              <TabsTrigger value="settings">System settings</TabsTrigger>
              <TabsTrigger value="circ-rules">Circulation rules</TabsTrigger>
              <TabsTrigger value="patron-types">Patron types</TabsTrigger>
              <TabsTrigger value="item-types">Item types</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="fine-rules">Fine rules</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Staff & roles ──────────────────────────────────────────────── */}
          <TabsContent value="staff" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Staff users</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditStaff(null);
                    setStaffDialog(true);
                  }}
                >
                  + Add user
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "Admin" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.branch}</TableCell>
                        <TableCell className="mono text-xs">{u.lastLogin}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditStaff(u);
                              setStaffDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Patrons ───────────────────────────────────────────────────── */}
          <TabsContent value="patrons" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Patron records</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditPatron(null);
                    setPatronDialog(true);
                  }}
                >
                  + Register patron
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mono">Card #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fines</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patronList.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="mono text-xs">{p.cardNumber}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "Active"
                                ? "default"
                                : p.status === "Suspended"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right mono ${p.fines > 0 ? "text-destructive" : ""}`}
                        >
                          ${p.fines.toFixed(2)}
                        </TableCell>
                        <TableCell className="mono text-xs">{p.joined}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditPatron(p);
                              setPatronDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── System settings ───────────────────────────────────────────── */}
          <TabsContent value="settings" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Library identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Library name</Label>
                    <Input defaultValue="Athenaeum Public Library" />
                  </div>
                  <div>
                    <Label>Default branch</Label>
                    <Select defaultValue="central">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="riverside">Riverside</SelectItem>
                        <SelectItem value="northhill">North Hill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contact email</Label>
                    <Input defaultValue="info@athenaeum.lib" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Integrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Z39.50 / SRU targets", desc: "External cataloging sources", on: true },
                    {
                      name: "EDIFACT acquisitions",
                      desc: "Electronic ordering with vendors",
                      on: true,
                    },
                    { name: "OAuth2 patron sign-in", desc: "Single sign-on for OPAC", on: false },
                    {
                      name: "Email notifications (SMTP)",
                      desc: "Due date and hold alerts",
                      on: true,
                    },
                    { name: "SIP2 self-checkout", desc: "Self-service kiosks", on: false },
                  ].map((i) => (
                    <div key={i.name} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.desc}</div>
                      </div>
                      <Switch
                        defaultChecked={i.on}
                        onCheckedChange={() => toast.success(`${i.name} updated`)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Circulation rules ─────────────────────────────────────────── */}
          <TabsContent value="circ-rules" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Circulation rules</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditCircRule(null);
                    setCircRuleDialog(true);
                  }}
                >
                  + Add rule
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron category</TableHead>
                      <TableHead>Item type</TableHead>
                      <TableHead className="text-right">Loan (days)</TableHead>
                      <TableHead className="text-right">Renewals</TableHead>
                      <TableHead className="text-right">Fine / day</TableHead>
                      <TableHead className="text-right">Max checkouts</TableHead>
                      <TableHead className="text-center">Holdable</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {circRuleList.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.patronCategory}</TableCell>
                        <TableCell>{r.itemType}</TableCell>
                        <TableCell className="text-right mono">{r.loanDays}</TableCell>
                        <TableCell className="text-right mono">{r.renewals}</TableCell>
                        <TableCell className="text-right mono">
                          ${r.finePerDay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right mono">{r.maxCheckouts}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={r.holdable ? "default" : "outline"}>
                            {r.holdable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditCircRule(r);
                              setCircRuleDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Patron types ──────────────────────────────────────────────── */}
          <TabsContent value="patron-types" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Patron types</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditCategory(null);
                    setCategoryDialog(true);
                  }}
                >
                  + Add category
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Loan period (days)</TableHead>
                      <TableHead className="text-right">Max checkouts</TableHead>
                      <TableHead className="text-right">Max renewals</TableHead>
                      <TableHead className="text-right">Fine / day ($)</TableHead>
                      <TableHead className="text-right">Reg. fee ($)</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryList.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right mono">{c.loanPeriod}</TableCell>
                        <TableCell className="text-right mono">{c.maxCheckouts}</TableCell>
                        <TableCell className="text-right mono">{c.maxRenewals}</TableCell>
                        <TableCell className="text-right mono">
                          ${c.finePerDay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right mono">
                          ${c.registrationFee.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.description}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditCategory(c);
                              setCategoryDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Item types ────────────────────────────────────────────────── */}
          <TabsContent value="item-types" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Item types</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditItemType(null);
                    setItemTypeDialog(true);
                  }}
                >
                  + Add item type
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Loan period (days)</TableHead>
                      <TableHead className="text-right">Renewals</TableHead>
                      <TableHead className="text-right">Fine / day ($)</TableHead>
                      <TableHead className="text-center">Not for loan</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemTypeList.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="mono font-medium">{t.code}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell className="text-right mono">{t.loanPeriod}</TableCell>
                        <TableCell className="text-right mono">{t.renewals}</TableCell>
                        <TableCell className="text-right mono">
                          ${t.finePerDay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={t.notForLoan ? "destructive" : "outline"}>
                            {t.notForLoan ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditItemType(t);
                              setItemTypeDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Branches ──────────────────────────────────────────────────── */}
          <TabsContent value="branches" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Branches</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditBranch(null);
                    setBranchDialog(true);
                  }}
                >
                  + Add branch
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchList.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.address}</TableCell>
                        <TableCell className="mono text-xs">{b.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.email}</TableCell>
                        <TableCell>{b.manager}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={b.active ? "default" : "outline"}>
                            {b.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditBranch(b);
                                setBranchDialog(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {b.active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  saveBranch({ ...b, active: false });
                                  toast.success(`${b.name} deactivated`);
                                }}
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Fine rules ────────────────────────────────────────────────── */}
          <TabsContent value="fine-rules" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif">Fine rules</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditFineRule(null);
                    setFineRuleDialog(true);
                  }}
                >
                  + Add rule
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron category</TableHead>
                      <TableHead>Item type</TableHead>
                      <TableHead className="text-right">Fine / day ($)</TableHead>
                      <TableHead className="text-right">Grace days</TableHead>
                      <TableHead className="text-right">Max fine ($)</TableHead>
                      <TableHead className="text-right">Lost after (days)</TableHead>
                      <TableHead className="text-right">Lost fee ($)</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fineRuleList.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.patronCategory}</TableCell>
                        <TableCell>{r.itemType}</TableCell>
                        <TableCell className="text-right mono">
                          ${r.finePerDay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right mono">{r.graceDays}</TableCell>
                        <TableCell className="text-right mono">${r.maxFine.toFixed(2)}</TableCell>
                        <TableCell className="text-right mono">{r.lostAfterDays}</TableCell>
                        <TableCell className="text-right mono">${r.lostFee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditFineRule(r);
                              setFineRuleDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <StaffDialog
        open={staffDialog}
        onOpenChange={setStaffDialog}
        editUser={editStaff}
        onSave={saveStaff}
      />
      <PatronDialog
        open={patronDialog}
        onOpenChange={setPatronDialog}
        editPatron={editPatron}
        onSave={savePatron}
      />
      <PatronCategoryDialog
        open={categoryDialog}
        onOpenChange={setCategoryDialog}
        editCategory={editCategory}
        onSave={saveCategory}
      />
      <ItemTypeDialog
        open={itemTypeDialog}
        onOpenChange={setItemTypeDialog}
        editItemType={editItemType}
        onSave={saveItemType}
      />
      <BranchDialog
        open={branchDialog}
        onOpenChange={setBranchDialog}
        editBranch={editBranch}
        onSave={saveBranch}
      />
      <CircRuleDialog
        open={circRuleDialog}
        onOpenChange={setCircRuleDialog}
        editRule={editCircRule}
        onSave={saveCircRule}
      />
      <FineRuleDialog
        open={fineRuleDialog}
        onOpenChange={setFineRuleDialog}
        editRule={editFineRule}
        onSave={saveFineRule}
      />
    </PageShell>
  );
}
