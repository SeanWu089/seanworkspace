import streamlit as st
from components import welcome, sidebar, statistics, modeling, data_info
import pandas as pd

st.set_page_config(
    page_title="Sean's Holistic Workspace",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Load custom CSS
with open('static/custom.css') as f:
    st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Session state initialization
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'welcome'
if 'data' not in st.session_state:
    # Sample data for demonstration
    st.session_state.data = pd.DataFrame({
        'A': range(1, 11),
        'B': [x * 2 for x in range(1, 11)],
        'C': ['cat', 'dog'] * 5,
        'E': [1.5, 2.5, 3.5, 4.5, 5.5] * 2
    })

# Main layout
left_arrow, main_content, right_arrow = st.columns([1, 10, 1])

with left_arrow:
    if st.button('←'):
        st.session_state.show_left_sidebar = True

with right_arrow:
    if st.button('→'):
        st.session_state.show_right_sidebar = True

with main_content:
    if st.session_state.current_page == 'welcome':
        welcome.show()
    elif st.session_state.current_page == 'statistics':
        statistics.show()
    elif st.session_state.current_page == 'modeling':
        modeling.show()

# Sidebars
sidebar.show_left_sidebar()
data_info.show_right_sidebar()
