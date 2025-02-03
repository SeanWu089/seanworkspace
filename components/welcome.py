import streamlit as st

def show():
    st.markdown("""
        <div style="text-align: center;">
            <h1 class="handwriting">Welcome to Sean's Holistic Workspace</h1>
        </div>
        """, unsafe_allow_html=True)

    # Statistical Tools Section
    st.header("Descriptive Statistics")

    # Discrepency Section
    st.subheader("Discrepency")
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("Z-Score", key="z_score", help="Calculate z-scores for your data"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'z_score'
            st.rerun()

    with col2:
        if st.button("T-Test", key="t_test", help="Compare means between two groups"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 't_test'
            st.rerun()

    with col3:
        if st.button("ANOVA", key="anova", help="Compare means between multiple groups"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'anova'
            st.rerun()

    # Correlation Section
    st.subheader("Correlation")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Pearson", key="pearson", help="Linear correlation between variables"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'pearson'
            st.rerun()

    with col2:
        if st.button("Spearman", key="spearman", help="Rank-based correlation between variables"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'spearman'
            st.rerun()

    st.header("Statistical Modeling")

    # Modeling Options
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("Linear", key="linear", help="Ordinary least squares (OLS) and generalized linear models"):
            st.session_state.current_page = 'modeling'
            st.session_state.current_tool = 'linear'
            st.rerun()

    with col2:
        if st.button("Non-Linear", key="nonlinear", help="Non-linear regression models"):
            st.session_state.current_page = 'modeling'
            st.session_state.current_tool = 'nonlinear'
            st.rerun()

    with col3:
        if st.button("Ensemble", key="ensemble", help="Random Forest and other ensemble methods"):
            st.session_state.current_page = 'modeling'
            st.session_state.current_tool = 'ensemble'
            st.rerun()

    # AI Assistant Input at bottom
    st.text_input("Ask AI Assistant", key="ai_input")
    if st.button("Send", key="send_ai"):
        st.write("AI response will be integrated here")