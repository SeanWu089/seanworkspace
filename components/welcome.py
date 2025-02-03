import streamlit as st

def show():
    st.markdown("""
        <div style="text-align: center;">
            <h1 class="handwriting">Welcome to Sean's Holistic Workspace</h1>
        </div>
        """, unsafe_allow_html=True)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="highlight-box">
            <h3>Getting Started</h3>
            <p>Click the left arrow to explore statistical tools and models</p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="highlight-box">
            <h3>Features</h3>
            <p>Comprehensive statistical analysis tools at your fingertips</p>
        </div>
        """, unsafe_allow_html=True)