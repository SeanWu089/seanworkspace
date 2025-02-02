import streamlit as st
import plotly.express as px
from utils.stats_utils import fit_linear_model

def show():
    st.header("Statistical Modeling")
    
    model_type = st.selectbox(
        "Select Model",
        ["Linear Regression", "Random Forest"]
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Independent Variables")
        iv_vars = st.multiselect(
            "Select Independent Variables",
            st.session_state.data.select_dtypes(include=['int64', 'float64']).columns.tolist(),
            key="iv_select"
        )
    
    with col2:
        st.subheader("Dependent Variable")
        dv_var = st.selectbox(
            "Select Dependent Variable",
            st.session_state.data.select_dtypes(include=['int64', 'float64']).columns.tolist(),
            key="dv_select"
        )
    
    if st.button("Shazam"):
        if model_type == "Linear Regression":
            results = fit_linear_model(st.session_state.data, iv_vars, dv_var)
            
            # Display results
            col1, col2 = st.columns(2)
            with col1:
                fig = px.scatter(
                    st.session_state.data,
                    x=iv_vars[0] if iv_vars else None,
                    y=dv_var,
                    trendline="ols"
                )
                st.plotly_chart(fig)
            
            with col2:
                st.write("Model Statistics:")
                st.write(f"R² = {results['r2']:.3f}")
                st.write(f"p-value = {results['p_value']:.3f}")
                st.write("\nCoefficients:")
                st.write(results['coef_table'])
