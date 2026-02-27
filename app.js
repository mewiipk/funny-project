const STORAGE_KEY = "budget-buddy-v1";

const state = {
  month: "",
  budgetGoal: 0,
  transactions: [],
};

const els = {
  budgetForm: document.getElementById("budget-form"),
  transactionForm: document.getElementById("transaction-form"),
  month: document.getElementById("month"),
  budgetGoal: document.getElementById("budget-goal"),
  type: document.getElementById("type"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  amount: document.getElementById("amount"),
  notes: document.getElementById("notes"),
  incomeTotal: document.getElementById("income-total"),
  expenseTotal: document.getElementById("expense-total"),
  remainingTotal: document.getElementById("remaining-total"),
  progressTotal: document.getElementById("progress-total"),
  progressBar: document.getElementById("progress-bar"),
  transactionTable: document.getElementById("transaction-table"),
  categoryList: document.getElementById("category-list"),
  clearData: document.getElementById("clear-data"),
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    els.month.value = new Date().toISOString().slice(0, 7);
    els.date.value = new Date().toISOString().slice(0, 10);
    return;
  }

  const parsed = JSON.parse(saved);
  state.month = parsed.month || "";
  state.budgetGoal = Number(parsed.budgetGoal || 0);
  state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];

  els.month.value = state.month || new Date().toISOString().slice(0, 7);
  els.budgetGoal.value = state.budgetGoal || "";
  els.date.value = new Date().toISOString().slice(0, 10);
}

function setStats() {
  const income = state.transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = state.transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const remaining = state.budgetGoal + income - expense;
  const used = state.budgetGoal > 0 ? (expense / state.budgetGoal) * 100 : 0;
  const progress = Math.min(used, 100);

  els.incomeTotal.textContent = money(income);
  els.expenseTotal.textContent = money(expense);
  els.remainingTotal.textContent = money(remaining);
  els.remainingTotal.style.color = remaining < 0 ? "#dc2626" : "#059669";
  els.progressTotal.textContent = `${progress.toFixed(0)}%`;
  els.progressBar.style.width = `${progress}%`;
}

function renderTable() {
  els.transactionTable.innerHTML = "";

  const sorted = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  for (const tx of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td><span class="pill ${tx.type}">${tx.type}</span></td>
      <td>${tx.category}</td>
      <td>${tx.notes || "-"}</td>
      <td>${tx.type === "expense" ? "-" : "+"}${money(tx.amount)}</td>
      <td><button data-id="${tx.id}" class="danger">Delete</button></td>
    `;
    els.transactionTable.append(tr);
  }
}

function renderCategories() {
  const expenseTx = state.transactions.filter((tx) => tx.type === "expense");
  const totals = expenseTx.reduce((map, tx) => {
    map[tx.category] = (map[tx.category] || 0) + tx.amount;
    return map;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  els.categoryList.innerHTML = "";

  if (entries.length === 0) {
    els.categoryList.innerHTML = "<li>No expenses recorded yet.</li>";
    return;
  }

  const max = entries[0][1];
  for (const [category, total] of entries) {
    const percent = (total / max) * 100;
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${category}</strong>
        <div class="bar-track"><div class="bar" style="width:${percent}%"></div></div>
      </div>
      <span>${money(total)}</span>
    `;
    els.categoryList.append(li);
  }
}

function render() {
  setStats();
  renderTable();
  renderCategories();
}

els.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.month = els.month.value;
  state.budgetGoal = Number(els.budgetGoal.value);
  save();
  render();
});

els.transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const tx = {
    id: uid(),
    type: els.type.value,
    category: els.category.value.trim(),
    date: els.date.value,
    notes: els.notes.value.trim(),
    amount: Number(els.amount.value),
  };

  state.transactions.push(tx);
  save();
  render();

  els.transactionForm.reset();
  els.type.value = "expense";
  els.date.value = new Date().toISOString().slice(0, 10);
});

els.transactionTable.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.dataset.id) return;

  state.transactions = state.transactions.filter((tx) => tx.id !== target.dataset.id);
  save();
  render();
});

els.clearData.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state.month = "";
  state.budgetGoal = 0;
  state.transactions = [];
  els.budgetGoal.value = "";
  els.month.value = new Date().toISOString().slice(0, 7);
  render();
});

load();
render();
