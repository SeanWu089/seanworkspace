import streamlit as st
import plotly.express as px
from utils.stats_utils import run_statistical_test

def show():
    # Descriptive Statistics Section
    st.header("Descriptive Statistics")

    # Discrepency Section
    st.subheader("Discrepency")
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("Z-Score", key="z_score", help="Calculate z-scores for your data"):
            st.session_state.current_tool = 'z_score'

    with col2:
        if st.button("T-Test", key="t_test", help="Compare means between two groups"):
            st.session_state.current_tool = 't_test'

    with col3:
        if st.button("ANOVA", key="anova", help="Compare means between multiple groups"):
            st.session_state.current_tool = 'anova'

    # Correlation Section
    st.subheader("Correlation")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Pearson", key="pearson", help="Linear correlation between variables"):
            st.session_state.current_tool = 'pearson'

    with col2:
        if st.button("Spearman", key="spearman", help="Rank-based correlation between variables"):
            st.session_state.current_tool = 'spearman'

    # Statistical Modeling Section
    st.header("Statistical Modeling")

    # Modeling Options
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("Linear", key="linear", help="Ordinary least squares (OLS) and generalized linear models"):
            st.session_state.current_tool = 'linear'

    with col2:
        if st.button("Non-Linear", key="nonlinear", help="Non-linear regression models"):
            st.session_state.current_tool = 'nonlinear'

    with col3:
        if st.button("Ensemble", key="ensemble", help="Random Forest and other ensemble methods"):
            st.session_state.current_tool = 'ensemble'

    # AI Assistant Input at bottom
    st.text_input("Ask AI Assistant", key="ai_input")
    if st.button("Send", key="send_ai"):
        st.write("AI response will be integrated here")