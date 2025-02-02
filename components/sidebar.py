import streamlit as st

def show_left_sidebar():
    with st.sidebar:
        st.title("Statistical Tools")
        
        if st.button("Descriptive Statistics"):
            st.session_state.current_page = 'statistics'
            st.session_state.current_tool = 'descriptive'
            
        if st.button("Statistical Modeling"):
            st.session_state.current_page = 'modeling'
            st.session_state.current_tool = 'modeling'
            
        if st.button("Home"):
            st.session_state.current_page = 'welcome'
