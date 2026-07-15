import React, { useState } from "react";
import { DataTable, Button, Modal, ModalFooter, FormField, Input } from "@/components/ui";
import { useCategoryFeeRates, useUpsertFeeRate, CategoryFeeRate } from "../../hooks/useFinance";
import { useDataLookups } from "../../hooks/useDataLookups";
import { Edit2 } from "lucide-react";

export function FeeRatesManager() {
  const { data: rates = [], isLoading: loadingRates } = useCategoryFeeRates();
  const { data: lookups = [], isLoading: loadingLookups } = useDataLookups();
  const { mutateAsync: upsertRate, isPending } = useUpsertFeeRate();

  // Find member categories from lookups
  const memberCategories = lookups.filter(
    (l) => l.type.toLowerCase() === "member category" || l.category?.toLowerCase() === "member_category"
  );

  // Combine categories with their current rates
  const data = memberCategories.map((cat) => {
    const rate = rates.find((r) => r.categoryId === cat.id);
    return {
      category: cat,
      rate,
    };
  });

  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openEdit = (row: any) => {
    setSelectedCategory(row.category);
    setAmount(row.rate?.amount || "");
    setCurrency(row.rate?.currency || "ETB");
    setDescription(row.rate?.description || "");
    setEditOpen(true);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    
    try {
      await upsertRate({
        categoryId: selectedCategory.id,
        amount: Number(amount),
        currency,
        description: description || undefined,
      });
      setEditOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save fee rate.");
    }
  };

  const columns = [
    {
      key: "category",
      header: "Member Category",
      cell: (row: any) => (
        <span className="font-medium text-zinc-900 dark:text-white">
          {row.category.value}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row: any) => (
        <span className="text-zinc-500 text-sm">
          {row.category.description}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Current Fee",
      cell: (row: any) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {row.rate ? `${row.rate.currency || 'ETB'} ${Number(row.rate.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Not Set"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      cell: (row: any) => (
        <Button
          onClick={() => openEdit(row)}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
        >
          <Edit2 className="h-3.5 w-3.5" /> {row.rate ? "Edit" : "Set Rate"}
        </Button>
      ),
    },
  ];

  if (loadingLookups || loadingRates) {
    return <div className="p-8 text-center animate-pulse text-zinc-500">Loading fee rates...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Category Fee Rates</h3>
        <p className="text-xs text-zinc-500">
          Set the annual reporting fee amount for each member category.
        </p>
      </div>

      <DataTable columns={columns} data={data} rowKey={(row) => row.category.id} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Set Fee Rate" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-4">
            <span className="text-xs text-zinc-500 block mb-1">Category</span>
            <span className="font-medium text-zinc-900 dark:text-white block">
              {selectedCategory?.value}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FormField id="amount" label="Fee Amount" required>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </FormField>
            </div>
            <div>
              <FormField id="currency" label="Currency">
                <select
                  id="currency"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="ETB">ETB</option>
                  <option value="USD">USD</option>
                </select>
              </FormField>
            </div>
          </div>

          <FormField id="description" label="Notes (Optional)">
            <Input
              id="description"
              placeholder="e.g. Standard rate for 2016 E.C"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Rate"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
