import streamlit as st

def show_left_sidebar():
    with st.sidebar:
        st.title("Navigation")

        if st.button("Home", key='home_btn'):
            st.session_state.current_page = 'welcome'
            st.rerun()