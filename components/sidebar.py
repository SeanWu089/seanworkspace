import streamlit as st

def show_left_sidebar():
    with st.sidebar:
        st.title("Statistical Tools")

        if st.button("Descriptive Statistics", key='desc_stats_btn'):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'descriptive'
            st.rerun()

        if st.button("Statistical Modeling", key='stats_model_btn'):
            st.session_state.current_page = 'modeling'
            st.session_state.current_tool = 'modeling'
            st.rerun()

        if st.button("Home", key='home_btn'):
            st.session_state.current_page = 'welcome'
            st.rerun()