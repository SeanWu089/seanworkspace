import pandas as pd
import numpy as np
from scipy import stats
from statsmodels.regression.linear_model import OLS
import statsmodels.api as sm

def run_statistical_test(test_type, data, variables):
    if test_type == "Z-Score":
        return stats.zscore(data[variables[0]])
    
    elif test_type == "T-Test":
        if len(variables) == 2:
            t_stat, p_val = stats.ttest_ind(data[variables[0]], data[variables[1]])
            return {"t_statistic": t_stat, "p_value": p_val}
    
    elif test_type == "ANOVA":
        groups = [data[var] for var in variables]
        f_stat, p_val = stats.f_oneway(*groups)
        return {"f_statistic": f_stat, "p_value": p_val}
    
    elif test_type in ["Pearson Correlation", "Spearman Correlation"]:
        if test_type == "Pearson Correlation":
            corr, p_val = stats.pearsonr(data[variables[0]], data[variables[1]])
        else:
            corr, p_val = stats.spearmanr(data[variables[0]], data[variables[1]])
        return {"correlation": corr, "p_value": p_val}

def fit_linear_model(data, iv_vars, dv_var):
    X = data[iv_vars]
    X = sm.add_constant(X)
    y = data[dv_var]
    
    model = OLS(y, X).fit()
    
    coef_table = pd.DataFrame({
        'beta': model.params,
        'CI': [f"{conf[0]:.2f} - {conf[1]:.2f}" for conf in model.conf_int()],
        'P': model.pvalues
    })
    
    return {
        'r2': model.rsquared,
        'p_value': model.f_pvalue,
        'coef_table': coef_table
    }
