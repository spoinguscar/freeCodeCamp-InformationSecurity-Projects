import socket
import threading
import common_ports
import ipaddress

def port_scanner(host, port, open_ports, lock):
    """Attempts to connect to a given port on a host to check if it is open."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(10)  # Slightly increased timeout for better reliability
            if s.connect_ex((host, port)) == 0:
                with lock:
                    open_ports.append(port)
    except socket.error:
        pass

def construct_string(ip, hostname, ports):
    """Constructs a formatted string displaying open ports and services."""
    if not ports:
        return f"Open ports for {ip}\nNo open ports found."
    
    if hostname and ip:
        result = [f"Open ports for {hostname} ({ip})", "PORT     SERVICE"]
    else:
        result = [f"Open ports for {ip}", "PORT     SERVICE"]
    for port in sorted(ports):
        service = common_ports.ports_and_services.get(port, "Unknown")
        result.append(f"{str(port).ljust(8)} {service}")
    
    return "\n".join(result)

def get_ip(target):
    """Resolves a hostname to an IP address."""
    try:
        return socket.gethostbyname(target)
    except socket.gaierror:
        return None

def get_hostname(ip):
    """Resolves an IP address to a hostname, if available."""
    try:
        return socket.gethostbyaddr(ip)[0]
    except socket.herror:
        return None

def get_open_ports(target, port_range, verbose=False):
    """Scans for open ports in the given range on the target host."""
    try:
        if target.replace(".", "").isdigit():
            ip = str(ipaddress.ip_address(target))
        else:
            ip = get_ip(target)
            if not ip:
                return "Error: Invalid hostname"
    except ValueError:
        return "Error: Invalid IP address"
    
    open_ports = []
    threads = []
    lock = threading.Lock()
    
    for port in range(port_range[0], port_range[1] + 1):
        t = threading.Thread(target=port_scanner, args=(ip, port, open_ports, lock))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    
    open_ports.sort()
    
    if verbose:
        hostname = get_hostname(ip)
        return construct_string(ip, hostname, open_ports)
    
    return open_ports
