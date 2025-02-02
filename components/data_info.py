import streamlit as st

def show_right_sidebar():
    with st.sidebar:
        st.title("Data Information")
        data = st.session_state.data
        
        # Basic info
        st.write("Variables:")
        for col in data.columns:
            st.write(f"{col}: {data[col].dtype}")
        
        # Expanded info button
        if st.button("Show Details"):
            st.write("\nDetailed Statistics:")
            for col in data.columns:
                st.write(f"\n{col}:")
                st.write(f"Unique values: {data[col].nunique()}")
                if data[col].dtype in ['int64', 'float64']:
                    st.write(f"Mean: {data[col].mean():.2f}")
                    st.write(f"Mode: {data[col].mode()[0]}")
