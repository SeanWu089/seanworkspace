import streamlit as st
import plotly.express as px
from utils.stats_utils import run_statistical_test

def show():
    st.header("Descriptive Statistics")
    
    # Test selection
    test_type = st.selectbox(
        "Select Statistical Test",
        ["Z-Score", "T-Test", "ANOVA", "Pearson Correlation", "Spearman Correlation"]
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        variables = st.multiselect(
            "Select Variables",
            st.session_state.data.columns.tolist()
        )
    
    with col2:
        if st.button("Calculate"):
            results = run_statistical_test(test_type, st.session_state.data, variables)
            st.write(results)
            
            # Visualization
            if test_type in ["Pearson Correlation", "Spearman Correlation"] and len(variables) == 2:
                fig = px.scatter(
                    st.session_state.data,
                    x=variables[0],
                    y=variables[1],
                    trendline="ols"
                )
                st.plotly_chart(fig)
    
    # AI Assistant input
    st.text_input("Ask AI Assistant", key="ai_input")
    if st.button("Send"):
        st.write("AI response will be integrated here")
