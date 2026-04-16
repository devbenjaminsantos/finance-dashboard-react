namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public static class PluggyCategoryMapper
    {
        public static string Categorize(string type, string description)
        {
            var normalizedType = (type ?? string.Empty).Trim().ToLowerInvariant();
            var normalizedDescription = (description ?? string.Empty).Trim().ToLowerInvariant();

            if (normalizedType == "income")
            {
                if (ContainsAny(normalizedDescription, "salario", "salary", "folha", "pro-labore"))
                {
                    return "Salario";
                }

                if (ContainsAny(normalizedDescription, "pix", "ted", "doc", "transfer"))
                {
                    return "Transferencias";
                }

                if (ContainsAny(normalizedDescription, "rendimento", "juros", "invest", "cdb"))
                {
                    return "Investimentos";
                }

                return "Outras receitas";
            }

            if (ContainsAny(normalizedDescription, "mercado", "supermercado", "ifood", "restaurante", "lanche"))
            {
                return "Alimentacao";
            }

            if (ContainsAny(normalizedDescription, "uber", "99", "combustivel", "posto", "onibus", "metro"))
            {
                return "Transporte";
            }

            if (ContainsAny(normalizedDescription, "aluguel", "condominio", "energia", "agua", "internet"))
            {
                return "Moradia";
            }

            if (ContainsAny(normalizedDescription, "farmacia", "medico", "consulta", "hospital"))
            {
                return "Saude";
            }

            if (ContainsAny(normalizedDescription, "pix", "ted", "doc", "transfer"))
            {
                return "Transferencias";
            }

            return "Outras despesas";
        }

        private static bool ContainsAny(string source, params string[] terms)
        {
            return terms.Any(term => source.Contains(term, StringComparison.OrdinalIgnoreCase));
        }
    }
}
