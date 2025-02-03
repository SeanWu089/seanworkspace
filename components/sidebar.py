import streamlit as st

def show_left_sidebar():
    with st.sidebar:
        st.title("Navigation")

        if st.button("Statistical Tools", key='stats_tools_btn'):
            st.session_state.current_page = 'statistics'
            st.rerun()

        if st.button("Visualizations", key='viz_btn'):
            st.session_state.current_page = 'visualizations'
            st.rerun()

        if st.button("Home", key='home_btn'):
            st.session_state.current_page = 'welcome'
            st.rerun()