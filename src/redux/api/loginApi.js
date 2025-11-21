
import supabase from "../../SupabaseClient";

export const LoginCredentialsApi = async (formData) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_name', formData.username)
        .eq('password', formData.password)
        .single(); // remove .eq('status', 'active')

    // Handle error or no data
    if (error || !data) {
        return { error: 'Invalid username or password' };
    }

    // 🔴 Add this check — if user is inactive, log them out immediately
    if (data.status !== 'active') {
        // Clear localStorage and reject login
        localStorage.clear();
        return { error: 'Your account is inactive. Please contact admin.' };
    }

    // Store user access in localStorage
    if (data.user_access) {
        localStorage.setItem("user_access", data.user_access);
    }

    return { data };
};