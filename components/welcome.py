import streamlit as st

def show():
    st.markdown("""
        <div style="text-align: center;">
            <h1 class="handwriting">Welcome to Sean's Holistic Workspace</h1>
        </div>
        """, unsafe_allow_html=True)

    # AI Assistant Input at bottom
    st.text_input("Ask AI Assistant", key="ai_input")
    if st.button("Send", key="send_ai"):
        st.write("AI response will be integrated here")